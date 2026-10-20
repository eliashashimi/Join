import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  private location = inject(Location);

  onBack(): void {
    this.location.back();
  }
}