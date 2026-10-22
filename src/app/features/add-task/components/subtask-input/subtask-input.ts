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

  onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.hasDraftError.set(false);
  }

  onDraftEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addSubtask();
  }

  addSubtask(): void {
    const title = this.draft().trim();
    if (!title) return this.hasDraftError.set(true);
    this.subtasks.update((list) => [...list, title]);
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  clearDraft(): void {
    this.draft.set('');
    this.hasDraftError.set(false);
  }

  startEdit(index: number): void {
    this.editIndex.set(index);
    this.editText.set(this.subtasks()[index]);
    this.hasEditError.set(false);
  }

  onEditInput(event: Event): void {
    this.editText.set((event.target as HTMLInputElement).value);
    this.hasEditError.set(false);
  }

  onEditEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.saveEdit();
  }

  saveEdit(): void {
    const index = this.editIndex();
    const title = this.editText().trim();
    if (index === null) return;
    if (!title) return this.hasEditError.set(true);
    this.subtasks.update((list) => list.map((item, i) => (i === index ? title : item)));
    this.editIndex.set(null);
  }

  cancelEdit(): void {
    this.editIndex.set(null);
    this.hasEditError.set(false);
  }

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
