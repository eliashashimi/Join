import { RouterLink } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { SummaryStatsService } from '../../service/summary-stats.service';
import { SummaryCard } from './components/summary-card/summary-card';
import { SummaryUrgent } from './components/summary-urgent/summary-urgent';
import { SummaryGreeting } from './components/summary-greeting/summary-greeting';

@Component({
  selector: 'app-summary',
  imports: [SummaryCard, SummaryUrgent, SummaryGreeting, RouterLink],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly taskService = inject(TaskService);
  private readonly statsService = inject(SummaryStatsService);

  readonly stats = computed(() => this.statsService.calcStats(this.taskService.tasks()));
  readonly userName = signal<string | null>(null);

  constructor() {
    this.taskService.getTasks();
  }
}