import { Component, model } from '@angular/core';

export type Priority = 'urgent' | 'medium' | 'low';

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

@Component({
  selector: 'app-priority-select',
  templateUrl: './priority-select.html',
  styleUrl: './priority-select.scss',
})
export class PrioritySelect {
  readonly priority = model<Priority>('medium');
  readonly priorities = PRIORITIES;

  select(value: Priority): void {
    this.priority.set(value);
  }
}
