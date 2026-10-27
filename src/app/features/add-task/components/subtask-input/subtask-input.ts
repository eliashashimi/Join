import { Component, model, signal } from '@angular/core';

@Component({
  selector: 'app-subtask-input',
  templateUrl: './subtask-input.html',
  styleUrl: './subtask-input.scss',
})
export class SubtaskInput {
  readonly subtasks = model<string[]>([]);
  readonly draft = signal('');
  readonly hasDraftError = signal(false);
  readonly editIndex = signal<number | null>(null);
  readonly editText = signal('');
  readonly hasEditError = signal(false);

  /**
   * Übernimmt den Text im Eingabefeld und entfernt die Fehlermeldung.
   * @param event das Input-Event des Eingabefelds
   */
  onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.hasDraftError.set(false);
  }

  /**
   * Legt bei Enter im Eingabefeld einen Subtask an, ohne das Formular abzusenden.
   * @param event das Tastatur-Event
   */
  onDraftEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addSubtask();
  }

  /**
   * Fügt den eingegebenen Text als Subtask hinzu und leert das Feld.
   * Bei leerem Text erscheint stattdessen die Fehlermeldung.
   */
  addSubtask(): void {
    const title = this.draft().trim();
    if (!title) return this.hasDraftError.set(true);
    this.subtasks.update((list) => [...list, title]);
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  /**
   * Leert das Eingabefeld, ohne einen Subtask anzulegen.
   */
  clearDraft(): void {
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  /**
   * Startet das Bearbeiten eines Subtasks.
   * @param index die Position des Subtasks in der Liste
   */
  startEdit(index: number): void {
    this.editIndex.set(index);
    this.editText.set(this.subtasks()[index]);
    this.hasEditError.set(false);
  }

  /**
   * Übernimmt den Text im Bearbeitungsfeld und entfernt die Fehlermeldung.
   * @param event das Input-Event des Bearbeitungsfelds
   */
  onEditInput(event: Event): void {
    this.editText.set((event.target as HTMLInputElement).value);
    this.hasEditError.set(false);
  }

  /**
   * Speichert bei Enter im Bearbeitungsfeld, ohne das Formular abzusenden.
   * @param event das Tastatur-Event
   */
  onEditEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.saveEdit();
  }

  /**
   * Speichert den bearbeiteten Subtask.
   * Bei leerem Text erscheint stattdessen die Fehlermeldung.
   */
  saveEdit(): void {
    const index = this.editIndex();
    const title = this.editText().trim();
    if (index === null) return;
    if (!title) return this.hasEditError.set(true);
    this.subtasks.update((list) => list.map((item, i) => (i === index ? title : item)));
    this.editIndex.set(null);
  }

  /**
   * Bricht das Bearbeiten ab, ohne zu speichern.
   */
  cancelEdit(): void {
    this.editIndex.set(null);
    this.hasEditError.set(false);
  }

  /**
   * Löscht einen Subtask und passt den Bearbeitungsmodus an.
   * @param index die Position des Subtasks in der Liste
   */
  removeSubtask(index: number): void {
    this.subtasks.update((list) => list.filter((_, i) => i !== index));
    const editing = this.editIndex();
    if (editing === null) return;
    if (editing === index) {
      this.editIndex.set(null);
      this.hasEditError.set(false);
    } else if (editing > index) {
      this.editIndex.set(editing - 1);
    }
  }
}