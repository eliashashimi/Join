/**
 * Eingabefeld "Add new subtask" mit Liste der Subtasks.
 *
 * Verwendung im Formular:
 *   subtasks = signal<string[]>([]);
 *   <app-subtask-input [(subtasks)]="subtasks" />
 *
 * Enter im Feld legt nur einen Subtask an. Das umgebende Formular wird dabei
 * nicht abgeschickt. Leere Subtasks werden nicht übernommen.
 */
@Component({
  selector: 'app-subtask-input',
  templateUrl: './subtask-input.html',
  styleUrl: './subtask-input.scss',
})
export class SubtaskInput {
  /** Titel aller Subtasks (Two-Way-Binding mit [(subtasks)]). */
  readonly subtasks = model<string[]>([]);
  readonly draft = signal('');
  readonly hasDraftError = signal(false);
  readonly editIndex = signal<number | null>(null);
  readonly editText = signal('');
  readonly hasEditError = signal(false);

  /** Übernimmt den Text aus dem Eingabefeld. */
  onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.hasDraftError.set(false);
  }

  /** Enter im Feld: Subtask anlegen, Formular nicht abschicken. */
  onDraftEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addSubtask();
  }

  /** Fügt den Subtask zur Liste hinzu und leert das Feld. */
  addSubtask(): void {
    const title = this.draft().trim();
    if (!title) return this.hasDraftError.set(true);
    this.subtasks.update((list) => [...list, title]);
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  /** Setzt das Eingabefeld zurück, ohne einen Subtask anzulegen. */
  clearDraft(): void {
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  /** Startet das Bearbeiten eines Subtasks. */
  startEdit(index: number): void {
    this.editIndex.set(index);
    this.editText.set(this.subtasks()[index]);
    this.hasEditError.set(false);
  }

  /** Übernimmt den Text aus dem Bearbeiten-Feld. */
  onEditInput(event: Event): void {
    this.editText.set((event.target as HTMLInputElement).value);
    this.hasEditError.set(false);
  }

  /** Enter im Bearbeiten-Feld: Änderung speichern, Formular nicht abschicken. */
  onEditEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.saveEdit();
  }

  /** Speichert den geänderten Titel. Ein leerer Titel wird nicht übernommen. */
  saveEdit(): void {
    const index = this.editIndex();
    const title = this.editText().trim();
    if (index === null) return;
    if (!title) return this.hasEditError.set(true);
    this.subtasks.update((list) => list.map((item, i) => (i === index ? title : item)));
    this.editIndex.set(null);
  }

  /** Bricht das Bearbeiten ab. */
  cancelEdit(): void {
    this.editIndex.set(null);
    this.hasEditError.set(false);
  }

  /** Löscht einen Subtask. */
  removeSubtask(index: number): void {
    this.subtasks.update((list) => list.filter((_, i) => i !== index));
    if (this.editIndex() === index) this.editIndex.set(null);
  }
}
