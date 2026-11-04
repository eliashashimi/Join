import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  private location = inject(Location);
  private router = inject(Router);

  onBack(): void {
    this.location.back();
  }

  /**
   * Navigiert zurück zur Signup-Formularseite.
   */
  navigateBack(): void {
    this.router.navigate(['/signup']);
  }
}