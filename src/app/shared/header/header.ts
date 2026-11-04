import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../service/auth-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: { '(document:click)': 'closeUserMenuOnOutsideClick($event)' },
})
export class HeaderComponent {
  private router = inject(Router);
  readonly auth = inject(AuthService);

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


  /** Öffnet oder schließt das Menü unter dem Avatar. */
  toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
  }


  /**
   * Schließt das Menü, wenn außerhalb davon geklickt wird.
   * @param event der Klick auf der Seite
   */
  closeUserMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target.closest('.user-menu, .user-avatar-sm')) this.showUserMenu.set(false);
  }


  /** Meldet den Nutzer ab und geht zur Login-Seite. */
  async logout(): Promise<void> {
    this.showUserMenu.set(false);
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
