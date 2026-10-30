import { Component, input } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
})

export class SummaryCard {
  icon = input<string>('');
  count = input.required<number>();
  label = input.required<string>();
}