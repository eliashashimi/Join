import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { TaskInterface } from '../../../interface/task-interface';
import { ContactService } from '../../../service/contact-service';
import { TaskService } from '../../../service/task-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-task-overlay',
  styleUrl: './task-overlay.scss',
  templateUrl: './task-overlay.html',
})
export class TaskOverlay {
  @Input({ required: true }) task!: TaskInterface;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() taskDeleted = new EventEmitter<void>();
  contactService = inject(ContactService);
  taskService = inject(TaskService);

  isEditing = false;

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  toggleSubtask(index: number) {
    if (this.task.subtasks && this.task.subtasks[index]) {
      this.task.subtasks[index].done = !this.task.subtasks[index].done;
    }
  }

  onDelete() {
    this.taskService.deleteTask(this.task.id);
    this.taskDeleted.emit();
    this.closeOverlay.emit();
  }

  onEdit() {
    this.isEditing = true;
  }
}
