import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskData, TaskStatus } from '../../../interface/task-interface';
import { TaskService } from '../../../service/task-service';
import { AssignedToDropdown } from '../components/assigned-to-dropdown/assigned-to-dropdown';
import { CategorySelect } from '../components/category-select/category-select';
import { Priority, PrioritySelect } from '../components/priority-select/priority-select';
import { SubtaskInput } from '../components/subtask-input/subtask-input';
import { DatePickerButton } from '../../../shared/date-picker-button/date-picker-button';
import { dueDateValidator, formatDateInput, toIsoDate } from './task-form-utils';

@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    AssignedToDropdown,
    CategorySelect,
    PrioritySelect,
    SubtaskInput,
    DatePickerButton,
  ],
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
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
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

  /**
   * Prüft, ob ein Pflichtfeld als fehlerhaft angezeigt werden soll.
   * @param name Name des Formularfelds
   * @returns true, wenn das Feld ungültig und berührt oder abgesendet ist
   */
  isInvalid(name: 'title' | 'dueDate'): boolean {
    const control = this.taskForm.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  /**
   * Liefert die Fehlermeldung zum Fälligkeitsdatum.
   * @returns der Hinweistext passend zum aktuellen Fehler
   */
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
    const control = this.taskForm.controls.dueDate;
    control.setValue(formatted);
    control.markAsTouched();
  }

  /**
   * Übernimmt das im Kalender gewählte Datum ins Formular.
   * @param date Das Datum als dd/mm/yyyy.
   */
  onDatePicked(date: string): void {
    const control = this.taskForm.controls.dueDate;
    control.setValue(date);
    control.markAsTouched();
    control.markAsDirty();
  }

  /**
   * Verhindert, dass Enter in den Feldern der rechten Spalte das Formular absendet.
   * @param event das Tastatur-Event vom Formular
   */
  blockSlotEnter(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.closest('.field__slot')) {
      event.preventDefault();
    }
  }

  /**
   * Validiert das Formular und legt den Task an.
   */
  async createTask(): Promise<void> {
    this.submitted.set(true);
    if (!this.isValid() || this.isSaving()) return;
    this.isSaving.set(true);
    this.hasSaveError.set(false);
    await this.saveTask();
    this.isSaving.set(false);
  }

  /**
   * Speichert den Task, leert das Formular und meldet Erfolg oder Fehler.
   */
  private async saveTask(): Promise<void> {
    try {
      await this.taskService.addTask(this.buildTaskData());
      this.clearForm();
      this.created.emit();
    } catch {
      this.hasSaveError.set(true);
    }
  }

  /**
   * Bricht im Overlay ab oder leert das Formular auf der Seite.
   */
  onSecondaryClick(): void {
    if (this.isOverlay()) this.cancelled.emit();
    else this.clearForm();
  }

  /**
   * Setzt alle Felder und Auswahlen auf den Anfangszustand zurück.
   */
  clearForm(): void {
    this.taskForm.reset();
    this.priority.set('medium');
    this.assigneeIds.set([]);
    this.category.set('');
    this.subtasks.set([]);
    this.submitted.set(false);
    this.hasSaveError.set(false);
  }

  /**
   * Markiert alle Felder als berührt und prüft das gesamte Formular.
   * @returns true, wenn alle Pflichtangaben gültig sind
   */
  private isValid(): boolean {
    this.taskForm.markAllAsTouched();
    return this.taskForm.valid && !!this.category();
  }

  /**
   * Baut aus den Formularwerten die Daten für die Datenbank.
   * @returns die Task-Daten mit Datum im Format yyyy-mm-dd
   */
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