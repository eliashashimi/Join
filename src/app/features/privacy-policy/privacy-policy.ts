import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
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