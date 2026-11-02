import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { TaskInterface } from '../../../interface/task-interface';
import { ContactService } from '../../../service/contact-service';
import { TaskService } from '../../../service/task-service';
import { CommonModule } from '@angular/common';
import { AssignedToDropdown } from '../../add-task/components/assigned-to-dropdown/assigned-to-dropdown';
import { PrioritySelect } from '../../add-task/components/priority-select/priority-select';
import { SubtaskInput } from '../../add-task/components/subtask-input/subtask-input';
import { DatePickerButton } from '../../../shared/date-picker-button/date-picker-button';
import {
  dueDateValidator,
  formatDateInput,
  toFormDate,
  toIsoDate,
} from '../../add-task/task-form/task-form-utils';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

/**
 * Die Detailansicht eines Tasks mit Bearbeiten und Löschen.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PrioritySelect,
    AssignedToDropdown,
    SubtaskInput,
    DatePickerButton,
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
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    description: [''],
    dueDate: ['', [Validators.required, (control) => this.dueDateRule(control)]],
  });

  /**
   * Prüft, ob ein Feld einen Fehler anzeigen soll.
   * @param name Der Name des Feldes.
   * @returns True, wenn das Feld ungültig und berührt oder abgeschickt ist.
   */
  isInvalid(name: 'title' | 'dueDate'): boolean {
    const control = this.taskForm.controls[name];
    return control.invalid && (control.touched || control.dirty || this.submitted());
  }

  titleMessage(): string {
    const errors = this.taskForm.controls.title.errors;
    if (!errors) return '';

    if (errors['maxlength']) {
      return 'Maxiumum 100 characters allowed';
    }

    if (errors['required'] || errors['pattern']) {
      return 'Please enter a title';
    }

    return '';
  }

  /**
   * Liefert die Fehlermeldung für das Fälligkeitsdatum.
   * @returns Der Text der Fehlermeldung.
   */
  dueDateMessage(): string {
    const errors = this.taskForm.controls.dueDate.errors;
    if (errors?.['invalidDate']) return 'Please use the format dd/mm/yyyy';
    if (errors?.['pastDate']) return 'The date must not be in the past';
    return 'This field is required';
  }

  /**
   * Prüft das Fälligkeitsdatum. Das alte Datum des Tasks bleibt erlaubt, auch wenn es
   * schon in der Vergangenheit liegt. Nur ein geändertes Datum wird geprüft.
   * @param control Das Datumsfeld im Formular.
   * @returns Die Fehler des Feldes oder null, wenn es gültig ist.
   */
  private dueDateRule(control: AbstractControl): ValidationErrors | null {
    const original = this.task ? toFormDate(this.task.dueDate) : '';
    if (original && control.value === original) return null;
    return dueDateValidator(control);
  }

  /**
   * Formatiert die Eingabe im Datumsfeld als dd/mm/yyyy und markiert das Feld als berührt.
   * @param event Das Eingabe-Ereignis des Feldes.
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

  isEditing = signal(false);
  readonly confirmingDelete = signal(false);
  readonly saving = signal(false);
  draft!: TaskInterface;
  editableSubtasks = signal<string[]>([]);

  /**
   * Liefert das Fälligkeitsdatum als dd/mm/yyyy für die Detailansicht.
   * @returns Das formatierte Datum.
   */
  dueDateText(): string {
    return toFormDate(this.task.dueDate);
  }

  /**
   * Liefert die Kontakte, die einem Task zugewiesen sind.
   * @param task Der Task.
   * @returns Die zugewiesenen Kontakte.
   */
  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  /**
   * Schließt das Overlay nur, wenn direkt auf den grauen Hintergrund (modal-overlay) geklickt wird.
   * @param event Der Klick auf das Overlay.
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeOverlay.emit();
    }
  }

  /**
   * Hakt einen Subtask ab oder wieder ab und lädt den Task neu aus dem Service.
   * @param index Die Position des Subtasks im Task.
   * @param done Der neue Zustand der Checkbox.
   */
  async toggleSubtask(index: number, done: boolean) {
    const subtask = this.task.subtasks?.[index];
    if (!subtask) return;
    await this.taskService.toggleSubtask(this.task.id, subtask.id, done);
    this.task = this.taskService.tasks().find((t) => t.id === this.task.id) ?? this.task;
  }

  /**
   * Fragt nach, ob der Task wirklich gelöscht werden soll.
   */
  onDelete() {
    this.confirmingDelete.set(true);
  }

  /**
   * Bricht das Löschen ab.
   */
  cancelDelete() {
    this.confirmingDelete.set(false);
  }

  /**
   * Löscht den Task und schließt die Ansicht. Schlägt das fehl, bleibt sie offen.
   */
  async confirmDelete() {
    try {
      await this.taskService.deleteTask(this.task.id);
      this.taskDeleted.emit();
      this.closeOverlay.emit();
    } catch {
      this.confirmingDelete.set(false);
    }
  }

  /**
   * Wechselt in den Bearbeitungsmodus und füllt das Formular mit den Daten des Tasks.
   */
  onEdit() {
    this.draft = structuredClone(this.task);
    this.editableSubtasks.set(this.draft.subtasks.map((s) => s.title));
    this.fillForm();
    this.isEditing.set(true);
  }

  /**
   * Speichert die Änderungen, wenn das Formular gültig ist. Während des Speicherns ist der Button gesperrt.
   */
  async saveChanges() {
    this.submitted.set(true);
    if (this.taskForm.invalid || this.saving()) return;
    this.saving.set(true);
    try {
      await this.persistChanges(this.buildUpdatedTask());
    } catch {
      // Der Toast kommt aus dem Service, das Edit bleibt offen
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Speichert den Task und kehrt zur Detailansicht zurück.
   * @param updated Der bearbeitete Task.
   */
  private async persistChanges(updated: TaskInterface): Promise<void> {
    await this.taskService.updateTask(updated);
    this.task = this.taskService.tasks().find((t) => t.id === updated.id) ?? updated;
    this.isEditing.set(false);
  }

  /**
   * Füllt das Formular mit den aktuellen Daten des Tasks.
   */
  private fillForm(): void {
    this.taskForm.reset({
      title: this.task.title,
      description: this.task.description,
      dueDate: toFormDate(this.task.dueDate),
    });
    this.submitted.set(false);
  }

  /**
   * Baut aus Formular und Entwurf den bearbeiteten Task.
   * @returns Der bearbeitete Task.
   */
  private buildUpdatedTask(): TaskInterface {
    const { title, description, dueDate } = this.taskForm.getRawValue();
    const subtasks = this.buildSubtasks();
    return { ...this.draft, title, description, dueDate: toIsoDate(dueDate), subtasks };
  }

  /**
   * Baut die Subtasks aus der Liste im Formular und übernimmt Status und ID bestehender Subtasks.
   * @returns Die Subtasks des bearbeiteten Tasks.
   */
  private buildSubtasks() {
    return this.editableSubtasks().map((title) => {
      const existing = this.task.subtasks?.find((s) => s.title === title);
      return { id: existing?.id || '', title: title.trim(), done: existing?.done || false };
    });
  }
}
