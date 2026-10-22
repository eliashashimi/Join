import { Component, Input, Output, EventEmitter, output, inject } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { TaskInterface } from '../../interface/task-interface';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../service/contact-service';

@Component({
  imports: [CommonModule],
  standalone: true,
  selector: 'app-drag-drop-tasks',
  styleUrl: './drag-drop-tasks.scss',
  templateUrl: './drag-drop-tasks.html',
})
export class DragDropTasks {
  @Input({ required: true }) task!: TaskInterface;
  @Output() openDetails = new EventEmitter<TaskInterface>();
  @Output() delete = new EventEmitter<string>();
  contactService = inject(ContactService);

  doneCount(task: TaskInterface): number {
    return task.subtasks?.filter((s) => s.done).length || 0;
  }
  readonly maxAvatars = 3;

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  onCardClick() {
    this.openDetails.emit(this.task);
  }
}
