export type TaskStatus = 'todo' | 'in_progress' | 'await_feedback' | 'done';
export type TaskPriority = 'urgent' | 'medium' | 'low';
export type TaskCategory = 'user_story' | 'technical_task';

/** Zeilen, wie sie in der Datenbank stehen. */
export interface SubtaskRow {
    id: string;
    task_id: string;
    title: string;
    done: boolean;
}
export interface TaskRow {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;
    position: number;
    created_at: string;
    updated_at: string;
}
export type TaskRowWithRelations = TaskRow & {
    subtasks: SubtaskRow[];
    task_assignees: { contact_id: string }[];
};

/** Task, wie ihn die App benutzt. */
export interface SubtaskInterface {
    id: string;
    title: string;
    done: boolean;
}
export interface TaskInterface {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;
    position: number;
    subtasks: SubtaskInterface[];
    assigneeIds: string[];
    createdAt: string;
    updatedAt: string;
}

/** Daten aus dem Add-Task-Formular. */
export interface TaskData {
    title: string;
    description?: string;
    dueDate?: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;
    assigneeIds: string[];
    subtasks: string[]; // nur die Titel
}
