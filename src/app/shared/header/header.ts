import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  showUserMenu = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update((open) => !open);
  }
}