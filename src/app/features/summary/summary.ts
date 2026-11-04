import { Router, RouterLink } from '@angular/router';
import { Component, computed, inject } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { AuthService } from '../../service/auth-service';
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
  private readonly router = inject(Router);

  readonly stats = computed(() => this.statsService.calcStats(this.taskService.tasks()));
  readonly userName = inject(AuthService).userName;

  readonly showGreetingScreen = this.cameFromLogin();


  constructor() {
    this.taskService.getTasks();
  }


  /**
   * Prüft, ob die Summary direkt nach dem Login geöffnet wurde.
   * @returns `true`, wenn die vorige Seite die Login-Seite war
   */
  private cameFromLogin(): boolean {
    const navigation = this.router.currentNavigation() ?? this.router.lastSuccessfulNavigation();
    return navigation?.previousNavigation?.finalUrl?.toString() === '/login';
  }
}