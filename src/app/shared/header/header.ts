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

  /** Aktuelle URL, aktualisiert sich nach jeder Navigation. */
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Seiten, auf denen das Hilfe-Symbol im Header ausgeblendet wird. */
  private hiddenHelpRoutes = ['/help', '/legal-notice', '/privacy-policy'];

  /**
   * Zeigt das Hilfe-Symbol nur auf Seiten, die nicht in `hiddenHelpRoutes` stehen.
   * @returns `true`, wenn das Symbol sichtbar sein soll
   */
  isHelpVisible = computed(
    () => !this.hiddenHelpRoutes.some((route) => this.currentUrl().startsWith(route)),
  );

  /** Öffnet oder schließt das Benutzermenü. */
  toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
  }
}