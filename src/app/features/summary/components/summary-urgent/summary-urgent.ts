import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-summary-urgent',
  imports: [DatePipe],
  templateUrl: './summary-urgent.html',
  styleUrl: './summary-urgent.scss',
})
export class SummaryUrgent {
  urgent = input.required<number>();
  medium = input.required<number>();
  low = input.required<number>();
  deadline = input<string | null>(null);

  /** Die drei Prioritäten mit Anzahl, Beschriftung und Icon. */
  readonly items = computed(() => [
  { key: 'urgent', label: 'Urgent', count: this.urgent(), icon: 'assets/icons/urgent-icon.svg' },
  { key: 'medium', label: 'Medium', count: this.medium(), icon: 'assets/icons/medium-icon.svg' },
  { key: 'low', label: 'Low', count: this.low(), icon: 'assets/icons/low-icon.svg' },
]);
}