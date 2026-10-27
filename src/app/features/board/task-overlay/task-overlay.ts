import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { TaskInterface } from '../../../interface/task-interface';
import { ContactService } from '../../../service/contact-service';
import { TaskService } from '../../../service/task-service';
import { CommonModule } from '@angular/common';
import { AssignedToDropdown } from '../../add-task/components/assigned-to-dropdown/assigned-to-dropdown';
import { PrioritySelect } from '../../add-task/components/priority-select/priority-select';
import { SubtaskInput } from '../../add-task/components/subtask-input/subtask-input';
import { dueDateValidator, formatDateInput, toFormDate, toIsoDate } from '../../add-task/task-form/task-form-utils';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  imports: [
    ReactiveFormsModule,
    CommonModule,
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
  readonly submitted = signal(false);
  private readonly fb = inject(FormBuilder);
  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    dueDate: ['', [Validators.required, dueDateValidator]],
  });

  isInvalid(name: 'title' | 'dueDate'): boolean {
    const control = this.taskForm.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  dueDateMessage(): string {
    const errors = this.taskForm.controls.dueDate.errors;
    if (errors?.['invalidDate']) return 'Please use the format dd/mm/yyyy';
    if (errors?.['pastDate']) return 'The date must not be in the past';
    return 'This field is required';
  }

  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatDateInput(input.value);
    input.value = formatted;
    this.taskForm.controls.dueDate.setValue(formatted);
  }

  isEditing = signal(false);
  readonly confirmingDelete = signal(false);
  draft!: TaskInterface;
  editableSubtasks = signal<string[]>([]);

  dueDateText(): string {
    return toFormDate(this.task.dueDate);
  }

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
    this.confirmingDelete.set(true);
  }

  cancelDelete() {
    this.confirmingDelete.set(false);
  }

  async confirmDelete() {
    try {
      await this.taskService.deleteTask(this.task.id);
      this.taskDeleted.emit();
      this.closeOverlay.emit();
    } catch {
      this.confirmingDelete.set(false);
    }
  }

  onEdit() {
    this.draft = structuredClone(this.task);
    this.editableSubtasks.set(this.draft.subtasks.map((s) => s.title));
    this.fillForm();
    this.isEditing.set(true);
  }

  async saveChanges() {
    this.submitted.set(true);
    if (this.taskForm.invalid) return;
    const updated = this.buildUpdatedTask();
    try {
      await this.taskService.updateTask(updated);
      this.task = this.taskService.tasks().find((t) => t.id === updated.id) ?? updated;
      this.isEditing.set(false);
    } catch {
    }
  }

  private fillForm(): void {
    this.taskForm.reset({
      title: this.task.title,
      description: this.task.description,
      dueDate: toFormDate(this.task.dueDate),
    });
    this.submitted.set(false);
  }

  private buildUpdatedTask(): TaskInterface {
    const { title, description, dueDate } = this.taskForm.getRawValue();
    const subtasks = this.buildSubtasks();
    return { ...this.draft, title, description, dueDate: toIsoDate(dueDate), subtasks };
  }

  private buildSubtasks() {
    return this.editableSubtasks().map((title) => {
      const existing = this.task.subtasks?.find((s) => s.title === title);
      return { id: existing?.id || '', title: title.trim(), done: existing?.done || false };
    });
  }
}