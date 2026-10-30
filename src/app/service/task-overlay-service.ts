import { Service, signal } from '@angular/core';
import { TaskStatus } from '../interface/task-interface';

@Service()
export class TaskOverlayService {
  readonly isOpen = signal(false);
  readonly status = signal<TaskStatus>('todo');

  /**
 * Öffnet das Add-Task-Overlay mit einem vorausgewählten Status.
 * @param status Die Spalte, in der der neue Task landen soll.
 */
  open(status: TaskStatus = 'todo'): void {
  this.status.set(status);
  this.isOpen.set(true);
}

/** Schließt das Add-Task-Overlay. */
  close(): void {
  this.isOpen.set(false);
}
}