import { Service, signal } from '@angular/core';
import { TaskStatus } from '../interface/task-interface';

@Service()
export class TaskOverlayService {
  readonly isOpen = signal(false);
  readonly status = signal<TaskStatus>('todo');

  open(status: TaskStatus = 'todo'): void {
    this.status.set(status);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}