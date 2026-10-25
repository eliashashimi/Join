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

  readonly tasks = this.taskList.asReadonly();
  readonly searchText = signal('');
  readonly showCreatedMessage = signal(false);

  readonly filteredTasks = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    return q
      ? this.taskList().filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
        )
      : this.taskList();
  });
  // readonly filteredTasks = computed(() => filterTasks(this.taskList(), this.searchText()));

  readonly noSearchResults = computed(
    () => this.searchText().trim() !== '' && this.filteredTasks().length === 0,
  );

  tasksByStatus(status: TaskStatus) {
    return computed(() => this.filteredTasks().filter((t) => t.status === status));
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
    const position = this.taskList().filter((t) => t.status === task.status).length;
    const { data } = await this.db
      .from(TABLE)
      .insert({
        title: task.title.trim(),
        description: task.description?.trim() || null,
        due_date: task.dueDate || null,
        category: task.category,
        priority: task.priority,
        status: task.status,
        position,
      })
      .select()
      .single()
      .throwOnError();
    const taskId = (data as TaskRow).id;

    try {
      if (task.assigneeIds.length)
        await this.db
          .from('task_assignees')
          .insert(task.assigneeIds.map((contact_id) => ({ task_id: taskId, contact_id })))
          .throwOnError();
      if (task.subtasks.length)
        await this.db
          .from('subtasks')
          .insert(task.subtasks.map((title) => ({ task_id: taskId, title: title.trim() })))
          .throwOnError();
    } catch (error) {
      await this.db.from(TABLE).delete().eq('id', taskId);
      throw error;
    }

    await this.getTasks();
    this.showCreatedToast();
    return this.taskList().find((t) => t.id === taskId)!;
  }

  async moveTask(id: string, status: TaskStatus, index: number): Promise<void> {
    const before = this.taskList();
    const fullIndex = toFullIndex(before, this.filteredTasks(), id, status, index);
    const after = placeTask(before, id, status, fullIndex);
    this.taskList.set(after);
    try {
      await this.savePositions(before, after);
    } catch (error) {
      console.error('Task konnte nicht verschoben werden', error);
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
    await this.db.from(TABLE).delete().eq('id', id).throwOnError();
    this.taskList.update((list) => list.filter((t) => t.id !== id));
  }
  private showCreatedToast(): void {
    this.showCreatedMessage.set(true);
    setTimeout(() => this.showCreatedMessage.set(false), 3000);
  }
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

function filterTasks(tasks: TaskInterface[], searchText: string): TaskInterface[] {
  const query = searchText.trim().toLowerCase();
  if (!query) return tasks;
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
  );
}
