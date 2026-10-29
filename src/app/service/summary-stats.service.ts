import { Injectable } from '@angular/core';
import { SummaryStats } from '../interface/summary-stats';

@Injectable({ providedIn: 'root' })
export class SummaryStatsService {
  /**
   * Berechnet alle Kennzahlen für das Summary-Dashboard.
   * @param tasks Liste aller Tasks aus Supabase
   */
  calcStats(tasks: any[]): SummaryStats {
    const count = (s: string) => tasks.filter(t => t.status === s).length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
    return {
      todo: count('todo'),
      done: count('done'),
      urgent: urgent.length,
      nextDeadline: this.nextDeadline(urgent),
      inBoard: tasks.length,
      inProgress: count('in_progress'),
      awaitingFeedback: count('await_feedback'),
    };
  }

  /**
   * Findet das früheste Fälligkeitsdatum der dringenden Tasks.
   * @param urgent Dringende, noch offene Tasks
   */
  private nextDeadline(urgent: any[]): string | null {
    const dates = urgent.map(t => t.due_date).filter(Boolean).sort();
    return dates[0] ?? null;
  }
}