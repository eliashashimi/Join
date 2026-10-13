import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private router = inject(Router);

  showUserMenu = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private hiddenHelpRoutes = ['/help', '/legal-notice', '/privacy-policy'];

  isHelpVisible = computed(
    () => !this.hiddenHelpRoutes.some((route) => this.currentUrl().startsWith(route)),
  );

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
  }
}