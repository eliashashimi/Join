import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help-page',
  standalone: true,
  templateUrl: './help-page.html',
  styleUrl: './help-page.scss',
})
export class HelpPageComponent {
  private location = inject(Location);

  onBack(): void {
    this.location.back();
  }
}