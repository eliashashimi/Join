import { computed, inject, Service, signal } from '@angular/core';
import {
  TaskData,
  TaskInterface,
  TaskRow,
  TaskRowWithRelations,
  TaskStatus,
} from '../interface/task-interface';
import { Supabase } from './supabase';

const TABLE = 'tasks';
const SELECT = '*, subtasks(*), task_assignees(contact_id)';

/**
 * Verwaltet alle Tasks des Boards: Laden, Anlegen, Bearbeiten, Verschieben und Löschen in Supabase sowie Suche und Toast-Meldungen.
 */
@Service()
export class TaskService {
  private readonly db = inject(Supabase).client;
  private readonly taskList = signal<TaskInterface[]>([]);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly tasks = this.taskList.asReadonly();
  readonly searchText = signal('');
  readonly toastMessage = signal('');

  readonly filteredTasks = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q
      ? this.taskList().filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
        )
      : this.taskList();
  });

  readonly noSearchResults = computed(
    () => this.searchText().trim() !== '' && this.filteredTasks().length === 0,
  );

  /**
   * Liefert ein Signal mit den (gefilterten) Tasks einer Spalte.
   * @param status Die Spalte, deren Tasks gebraucht werden.
   * @returns Ein Computed Signal mit den Tasks dieser Spalte.
   */
  tasksByStatus(status: TaskStatus) {
    return computed(() => this.filteredTasks().filter((t) => t.status === status));
  }

  /**
   * Zeigt einen Toast drei Sekunden lang an. Ein neuer Toast ersetzt den alten.
   * @param message Der Text, der im Toast steht.
   */
  showToast(message: string): void {
    clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3000);
  }

  /**
   * Lädt alle Tasks mit Subtasks und Zuweisungen aus Supabase und speichert sie im Signal.
   * @returns Die geladenen Tasks.
   */
  async getTasks(): Promise<TaskInterface[]> {
    const { data } = await this.db
      .from(TABLE)
      .select(SELECT)
      .order('position')
      .order('position', { referencedTable: 'subtasks' })
      .throwOnError();
    const tasks = (data as TaskRowWithRelations[]).map(toTask);
    this.taskList.set(tasks);
    return tasks;
  }

  /**
   * Legt einen neuen Task samt Zuweisungen und Subtasks an und zeigt einen Toast.
   * @param task Die Daten aus dem Formular.
   * @returns Der neu angelegte Task.
   */
  async addTask(task: TaskData): Promise<TaskInterface> {
    const taskId = await this.insertTask(task);
    await this.insertRelations(taskId, task);
    await this.getTasks();
    this.showToast('Task added to board');
    return this.taskList().find((t) => t.id === taskId)!;
  }

  /**
   * Speichert die Hauptdaten eines neuen Tasks am Ende seiner Spalte.
   * @param task Die Daten aus dem Formular.
   * @returns Die ID des neuen Tasks.
   */
  private async insertTask(task: TaskData): Promise<string> {
    const position = this.taskList().filter((t) => t.status === task.status).length;
    const { data } = await this.db
      .from(TABLE)
      .insert(toInsertRow(task, position))
      .select()
      .single()
      .throwOnError();
    return (data as TaskRow).id;
  }

  /**
   * Speichert Zuweisungen und Subtasks. Schlägt das fehl, wird der halbe Task wieder gelöscht.
   * @param taskId Die ID des neuen Tasks.
   * @param task Die Daten aus dem Formular.
   */
  private async insertRelations(taskId: string, task: TaskData): Promise<void> {
    try {
      await this.insertAssignees(taskId, task.assigneeIds);
      await this.insertSubtasks(taskId, task.subtasks);
    } catch (error) {
      await this.db.from(TABLE).delete().eq('id', taskId);
      throw error;
    }
  }

  /**
   * Weist einem Task Kontakte zu.
   * @param taskId Die ID des Tasks.
   * @param contactIds Die IDs der zugewiesenen Kontakte.
   */
  private async insertAssignees(taskId: string, contactIds: string[]): Promise<void> {
    if (!contactIds.length) return;
    const rows = contactIds.map((contact_id) => ({ task_id: taskId, contact_id }));
    await this.db.from('task_assignees').insert(rows).throwOnError();
  }

  /**
   * Legt die Subtasks eines Tasks an.
   * @param taskId Die ID des Tasks.
   * @param titles Die Titel der Subtasks.
   */
  private async insertSubtasks(taskId: string, titles: string[]): Promise<void> {
    if (!titles.length) return;
    const rows = titles.map((title) => ({ task_id: taskId, title: title.trim() }));
    await this.db.from('subtasks').insert(rows).throwOnError();
  }

  /**
   * Verschiebt einen Task sofort im Board und speichert danach die neuen Positionen. Bei einem Fehler kommt ein Toast und die Tasks werden neu geladen.
   * @param id Die ID des Tasks.
   * @param status Die Zielspalte.
   * @param index Die Position in der angezeigten Spalte.
   */
  async moveTask(id: string, status: TaskStatus, index: number): Promise<void> {
    const before = this.taskList();
    const fullIndex = toFullIndex(before, this.filteredTasks(), id, status, index);
    const after = placeTask(before, id, status, fullIndex);
    this.taskList.set(after);
    try {
      await this.savePositions(before, after);
    } catch {
      this.showToast('Task could not be moved');
      await this.getTasks().catch(() => undefined);
    }
  }

  /**
   * Speichert Status und Position aller Tasks, die sich verändert haben.
   * @param before Die Tasks vor dem Verschieben.
   * @param after Die Tasks nach dem Verschieben.
   */
  private async savePositions(before: TaskInterface[], after: TaskInterface[]): Promise<void> {
    const old = new Map(before.map((t) => [t.id, t] as const));
    const changed = after.filter((t) => {
      const previous = old.get(t.id);
      return previous?.status !== t.status || previous?.position !== t.position;
    });
    await Promise.all(
      changed.map((t) =>
        this.db
          .from(TABLE)
          .update({ status: t.status, position: t.position })
          .eq('id', t.id)
          .throwOnError(),
      ),
    );
  }

  /**
   * Hakt einen Subtask ab oder wieder ab und übernimmt das im Board.
   * @param taskId Die ID des Tasks.
   * @param subtaskId Die ID des Subtasks.
   * @param done Der neue Zustand des Subtasks.
   */
  async toggleSubtask(taskId: string, subtaskId: string, done: boolean): Promise<void> {
    await this.db.from('subtasks').update({ done }).eq('id', subtaskId).throwOnError();
    this.taskList.update((list) =>
      list.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done } : s)),
            },
      ),
    );
  }

  /**
   * Löscht einen Task und zeigt einen Toast. Bei einem Fehler wird dieser weitergegeben.
   * @param id Die ID des Tasks.
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.db.from(TABLE).delete().eq('id', id).throwOnError();
      this.taskList.update((list) => list.filter((t) => t.id !== id));
      this.showToast('Task deleted');
    } catch (error) {
      this.showToast('Task could not be deleted');
      throw error;
    }
  }

  /**
   * Speichert einen bearbeiteten Task samt Zuweisungen und Subtasks und zeigt einen Toast. Bei einem Fehler wird dieser weitergegeben.
   * @param task Der bearbeitete Task.
   */
  async updateTask(task: TaskInterface): Promise<void> {
    try {
      await this.saveMainTaskData(task);
      await this.saveTaskAssignees(task);
      await this.saveTaskSubtasks(task);
      await this.getTasks();
      this.showToast('Task updated');
    } catch (error) {
      this.showToast('Task could not be saved');
      throw error;
    }
  }

  /**
   * Speichert Titel, Beschreibung, Datum, Kategorie, Priorität und Status eines Tasks.
   * @param task Der bearbeitete Task.
   */
  private async saveMainTaskData(task: TaskInterface): Promise<void> {
    await this.db
      .from(TABLE)
      .update({
        title: task.title.trim(),
        description: task.description?.trim() || null,
        due_date: task.dueDate || null,
        category: task.category,
        priority: task.priority,
        status: task.status,
      })
      .eq('id', task.id)
      .throwOnError();
  }

  /**
   * Ersetzt die Zuweisungen eines Tasks durch die aktuellen.
   * @param task Der bearbeitete Task.
   */
  private async saveTaskAssignees(task: TaskInterface): Promise<void> {
    await this.db.from('task_assignees').delete().eq('task_id', task.id).throwOnError();
    if (task.assigneeIds.length) {
      const rows = task.assigneeIds.map((contact_id) => ({ task_id: task.id, contact_id }));
      await this.db.from('task_assignees').insert(rows).throwOnError();
    }
  }

  /**
   * Ersetzt die Subtasks eines Tasks durch die aktuellen.
   * @param task Der bearbeitete Task.
   */
  private async saveTaskSubtasks(task: TaskInterface): Promise<void> {
    await this.db.from('subtasks').delete().eq('task_id', task.id).throwOnError();
    if (task.subtasks.length) {
      const rows = task.subtasks.map((s) => ({
        task_id: task.id,
        title: s.title.trim(),
        done: s.done,
      }));
      await this.db.from('subtasks').insert(rows).throwOnError();
    }
  }
}

/**
 * Baut aus den Formulardaten die Zeile für die Tabelle tasks.
 * @param task Die Daten aus dem Formular.
 * @param position Die Position in der Spalte.
 * @returns Die Zeile für Supabase.
 */
function toInsertRow(task: TaskData, position: number) {
  return {
    title: task.title.trim(),
    description: task.description?.trim() || null,
    due_date: task.dueDate || null,
    category: task.category,
    priority: task.priority,
    status: task.status,
    position,
  };
}

/**
 * Wandelt eine Zeile aus Supabase in einen Task der App um.
 * @param row Die Zeile mit Subtasks und Zuweisungen.
 * @returns Der Task für die App.
 */
function toTask(row: TaskRowWithRelations): TaskInterface {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_date ?? '',
    category: row.category,
    priority: row.priority,
    status: row.status,
    position: row.position,
    subtasks: row.subtasks.map(({ id, title, done }) => ({ id, title, done })),
    assigneeIds: row.task_assignees.map((a) => a.contact_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Liefert die Tasks einer Spalte nach Position sortiert.
 * @param tasks Alle Tasks.
 * @param status Die Spalte.
 * @returns Die sortierten Tasks dieser Spalte.
 */
function column(tasks: TaskInterface[], status: TaskStatus): TaskInterface[] {
  return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
}

/**
 * Nummeriert die Positionen einer Spalte von 0 an neu durch.
 * @param tasks Die Tasks einer Spalte in der gewünschten Reihenfolge.
 * @returns Die Tasks mit neuen Positionen.
 */
function renumber(tasks: TaskInterface[]): TaskInterface[] {
  return tasks.map((task, position) => ({ ...task, position }));
}

/**
 * Setzt einen Task an eine Stelle einer Spalte und nummeriert die betroffenen Spalten neu.
 * @param tasks Alle Tasks.
 * @param id Die ID des verschobenen Tasks.
 * @param status Die Zielspalte.
 * @param index Die Position in der Zielspalte.
 * @returns Alle Tasks mit den neuen Positionen.
 */
function placeTask(
  tasks: TaskInterface[],
  id: string,
  status: TaskStatus,
  index: number,
): TaskInterface[] {
  const moved = tasks.find((t) => t.id === id);
  if (!moved) return tasks;
  const target = column(tasks, status).filter((t) => t.id !== id);
  target.splice(index, 0, { ...moved, status });
  const sourceTasks = column(tasks, moved.status).filter((t) => t.id !== id);
  const source = moved.status === status ? [] : renumber(sourceTasks);
  const rest = tasks.filter((t) => t.status !== status && t.status !== moved.status);
  return [...rest, ...renumber(target), ...source];
}

/**
 * Rechnet eine Position aus der gefilterten Ansicht in die Position in der vollständigen Spalte um.
 * @param all Alle Tasks.
 * @param shown Die gerade angezeigten (gefilterten) Tasks.
 * @param id Die ID des verschobenen Tasks.
 * @param status Die Zielspalte.
 * @param index Die Position in der angezeigten Spalte.
 * @returns Die Position in der vollständigen Spalte.
 */
function toFullIndex(
  all: TaskInterface[],
  shown: TaskInterface[],
  id: string,
  status: TaskStatus,
  index: number,
): number {
  const fullColumn = column(all, status).filter((t) => t.id !== id);
  const shownColumn = column(shown, status).filter((t) => t.id !== id);
  if (shownColumn.length === fullColumn.length) return index;
  if (index < shownColumn.length) return fullColumn.indexOf(shownColumn[index]);
  const last = shownColumn[shownColumn.length - 1];
  return last ? fullColumn.indexOf(last) + 1 : fullColumn.length;
}