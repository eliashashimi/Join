import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { TaskInterface, TaskStatus } from '../../interface/task-interface';
import { ContactService } from '../../service/contact-service';

@Component({
  imports: [],
  selector: 'app-drag-drop-tasks',
  styleUrl: './drag-drop-tasks.scss',
  templateUrl: './drag-drop-tasks.html',
})
export class DragDropTasks {
  @Input({ required: true }) task!: TaskInterface;
  @Output() openDetails = new EventEmitter<TaskInterface>();
  @Output() delete = new EventEmitter<string>();
  @Output() moveTo = new EventEmitter<TaskStatus>();
  contactService = inject(ContactService);

  readonly maxAvatars = 3;

  doneCount(task: TaskInterface): number {
    return task.subtasks?.filter((s) => s.done).length || 0;
  }

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  onCardClick() {
    this.openDetails.emit(this.task);
  }
}