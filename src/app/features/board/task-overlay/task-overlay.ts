import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { TaskInterface } from '../../../interface/task-interface';
import { ContactService } from '../../../service/contact-service';
import { TaskService } from '../../../service/task-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignedToDropdown } from '../../add-task/components/assigned-to-dropdown/assigned-to-dropdown';
import { CategorySelect } from '../../add-task/components/category-select/category-select';
import { PrioritySelect } from '../../add-task/components/priority-select/priority-select';
import { SubtaskInput } from '../../add-task/components/subtask-input/subtask-input';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    CategorySelect,
    PrioritySelect,
    AssignedToDropdown,
    SubtaskInput,
  ],
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
  editableSubtasks = signal<string[]>([]);

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  async toggleSubtask(index: number) {
    if (this.task.subtasks && this.task.subtasks[index]) {
      const subtask = this.task.subtasks[index];
      const newDoneState = !subtask.done;
      await this.taskService.toggleSubtask(this.task.id, subtask.id, newDoneState);
    }
  }

  onDelete() {
    this.taskService.deleteTask(this.task.id);
    this.taskDeleted.emit();
    this.closeOverlay.emit();
  }

  onEdit() {
    if (this.task.subtasks) {
      const titles = this.task.subtasks.map((s) => (typeof s === 'string' ? s : s.title));
      this.editableSubtasks.set(titles);
    } else {
      this.editableSubtasks.set([]);
    }
    this.isEditing = true;
  }

  async saveChanges() {
    const stringList = this.editableSubtasks();
    this.task.subtasks = stringList.map((title) => {
      const existing = this.task.subtasks?.find((s) => s.title === title);
      return {
        id: existing?.id || '',
        title: title.trim(),
        done: existing?.done || false,
      };
    });
    await this.taskService.updateTask(this.task);
    this.isEditing = false;
    this.closeOverlay.emit();
  }
}
