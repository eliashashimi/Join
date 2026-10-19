import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignedToDropdown } from './components/assigned-to-dropdown/assigned-to-dropdown';
import { CategorySelect } from './components/category-select/category-select';
import { SubtaskInput } from './components/subtask-input/subtask-input';
import { PrioritySelect, Priority } from './components/priority-select/priority-select';

@Component({
  imports: [ReactiveFormsModule, AssignedToDropdown, CategorySelect, SubtaskInput, PrioritySelect],
  selector: 'app-add-task',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {
  private readonly fb = inject(FormBuilder);

  readonly priority = signal<Priority>('medium');

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: ['', Validators.required],
  });

  readonly assigneeIds = signal<string[]>([]);
  readonly category = signal('');
  readonly subtasks = signal<string[]>([]);
  readonly submitted = signal(false);
}
