import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskData, TaskStatus } from '../../../interface/task-interface';
import { TaskService } from '../../../service/task-service';
import { AssignedToDropdown } from '../components/assigned-to-dropdown/assigned-to-dropdown';
import { CategorySelect } from '../components/category-select/category-select';
import { Priority, PrioritySelect } from '../components/priority-select/priority-select';
import { SubtaskInput } from '../components/subtask-input/subtask-input';
import { dueDateValidator, toIsoDate } from './task-form-utils';
import { formatDateInput } from './task-form-utils';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, AssignedToDropdown, CategorySelect, PrioritySelect, SubtaskInput],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  readonly isOverlay = input(false);
  readonly status = input<TaskStatus>('todo');
  readonly created = output<void>();
  readonly cancelled = output<void>();

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: ['', [Validators.required, dueDateValidator]],
  });

  readonly priority = signal<Priority>('medium');
  readonly assigneeIds = signal<string[]>([]);
  readonly category = signal('');
  readonly subtasks = signal<string[]>([]);
  readonly submitted = signal(false);
  readonly isSaving = signal(false);
  readonly hasSaveError = signal(false);

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

  /**
 * Setzt beim Tippen im Datumsfeld die Schrägstriche.
 * @param event das Input-Event des Datumsfelds
 */
  onDateInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const formatted = formatDateInput(input.value);
  input.value = formatted;
  this.taskForm.get('dueDate')?.setValue(formatted);
}

  async createTask(): Promise<void> {
    this.submitted.set(true);
    if (!this.isValid() || this.isSaving()) return;
    this.isSaving.set(true);
    this.hasSaveError.set(false);
    try {
      await this.taskService.addTask(this.buildTaskData());
      this.clearForm();
      this.created.emit();
    } catch {
      this.hasSaveError.set(true);
    } finally {
      this.isSaving.set(false);
    }
  }

  onSecondaryClick(): void {
    if (this.isOverlay()) this.cancelled.emit();
    else this.clearForm();
  }

  clearForm(): void {
    this.taskForm.reset();
    this.priority.set('medium');
    this.assigneeIds.set([]);
    this.category.set('');
    this.subtasks.set([]);
    this.submitted.set(false);
    this.hasSaveError.set(false);
  }

  private isValid(): boolean {
    this.taskForm.markAllAsTouched();
    return this.taskForm.valid && !!this.category();
  }

  private buildTaskData(): TaskData {
    const { title, description, dueDate } = this.taskForm.getRawValue();
    return {
      title,
      description,
      dueDate: toIsoDate(dueDate),
      category: this.category(),
      priority: this.priority(),
      status: this.status(),
      assigneeIds: this.assigneeIds(),
      subtasks: this.subtasks(),
    } as TaskData;
  }
}
