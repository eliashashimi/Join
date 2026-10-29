import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-summary-urgent',
  imports: [DatePipe],
  templateUrl: './summary-urgent.html',
  styleUrl: './summary-urgent.scss',
})
export class SummaryUrgent {
  count = input.required<number>();
  deadline = input<string | null>(null);
}