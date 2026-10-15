import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  private location = inject(Location);

  /** Geht zur vorherigen Seite zurück. */
  onBack(): void {
    this.location.back();
  }
}