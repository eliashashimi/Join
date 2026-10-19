import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignedToDropdown } from './components/assigned-to-dropdown/assigned-to-dropdown';
import { CategorySelect } from './components/category-select/category-select';
import { SubtaskInput } from './components/subtask-input/subtask-input';

@Component({
  imports: [ReactiveFormsModule, AssignedToDropdown, CategorySelect, SubtaskInput],
  selector: 'app-add-task',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {
  private readonly fb = inject(FormBuilder);

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: ['', Validators.required],
  });

  /**Werte aus den Komponenten (Zwei-Wege-Binding per [()]). */
  readonly assigneeIds = signal<string[]>([]);
  readonly category = signal('');
  readonly subtasks = signal<string[]>([]);
  /** Wird beim Klick auf "Create Task" auf true gesetzt, damit Pflichtfehler erscheinen. */
  readonly submitted = signal(false);
}
