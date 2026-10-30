import { Injectable } from '@angular/core';
import { SummaryStats } from '../interface/summary-stats';
import { TaskInterface, TaskStatus } from '../interface/task-interface';

@Injectable({ providedIn: 'root' })
export class SummaryStatsService {
  /**
   * Berechnet alle Kennzahlen für das Summary-Dashboard.
   * @param tasks Liste aller Tasks aus Supabase
   */
  calcStats(tasks: TaskInterface[]): SummaryStats {
    const status = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
    const open = tasks.filter((t) => t.status !== 'done');
    return {
      todo: status('todo'),
      done: status('done'),
      ...this.priorityCounts(open),
      nextDeadline: this.nextDeadline(open),
      inBoard: tasks.length,
      inProgress: status('in_progress'),
      awaitingFeedback: status('await_feedback'),
    };
  }

  /**
   * Zählt die offenen Tasks pro Priorität.
   * @param open Alle Tasks, die noch nicht in Done liegen
   */
  private priorityCounts(open: TaskInterface[]) {
    const count = (p: TaskInterface['priority']) => open.filter((t) => t.priority === p).length;
    return { urgent: count('urgent'), medium: count('medium'), low: count('low') };
  }

    /**
   * Findet das früheste Fälligkeitsdatum der offenen Tasks.
   * @param open Alle Tasks, die noch nicht in Done liegen
   */
  private nextDeadline(open: TaskInterface[]): string | null {
    const dates = open.map((t) => t.dueDate).filter(Boolean).sort();
    return dates[0] ?? null;
  }
}