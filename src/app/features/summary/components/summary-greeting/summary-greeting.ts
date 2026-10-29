import { Component, input } from '@angular/core';

@Component({
  selector: 'app-summary-greeting',
  templateUrl: './summary-greeting.html',
  styleUrl: './summary-greeting.scss',
})
export class SummaryGreeting {
  name = input<string | null>(null);

  /** Liefert die Begrüßung passend zur Tageszeit. */
  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    return h < 18 ? 'Good afternoon' : 'Good evening';
  }
}