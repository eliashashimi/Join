import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help-page.html',
  styleUrl: './help-page.scss'
})
export class HelpPageComponent {
  private router = inject(Router);

  goBack() {
    window.history.back();
  }
}
