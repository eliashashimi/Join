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

  tasksByStatus(status: TaskStatus) {
    return computed(() => this.filteredTasks().filter((t) => t.status === status));
  }

  showToast(message: string): void {
    clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3000);
  }

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

  async addTask(task: TaskData): Promise<TaskInterface> {
    const taskId = await this.insertTask(task);
    await this.insertRelations(taskId, task);
    await this.getTasks();
    this.showToast('Task added to board');
    return this.taskList().find((t) => t.id === taskId)!;
  }

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

  private async insertRelations(taskId: string, task: TaskData): Promise<void> {
    try {
      await this.insertAssignees(taskId, task.assigneeIds);
      await this.insertSubtasks(taskId, task.subtasks);
    } catch (error) {
      await this.db.from(TABLE).delete().eq('id', taskId);
      throw error;
    }
  }

  private async insertAssignees(taskId: string, contactIds: string[]): Promise<void> {
    if (!contactIds.length) return;
    const rows = contactIds.map((contact_id) => ({ task_id: taskId, contact_id }));
    await this.db.from('task_assignees').insert(rows).throwOnError();
  }

  private async insertSubtasks(taskId: string, titles: string[]): Promise<void> {
    if (!titles.length) return;
    const rows = titles.map((title) => ({ task_id: taskId, title: title.trim() }));
    await this.db.from('subtasks').insert(rows).throwOnError();
  }

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

  private async saveTaskAssignees(task: TaskInterface): Promise<void> {
    await this.db.from('task_assignees').delete().eq('task_id', task.id).throwOnError();
    if (task.assigneeIds.length) {
      const rows = task.assigneeIds.map((contact_id) => ({ task_id: task.id, contact_id }));
      await this.db.from('task_assignees').insert(rows).throwOnError();
    }
  }

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

function column(tasks: TaskInterface[], status: TaskStatus): TaskInterface[] {
  return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
}

function renumber(tasks: TaskInterface[]): TaskInterface[] {
  return tasks.map((task, position) => ({ ...task, position }));
}

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