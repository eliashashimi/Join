import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-page.html',
  styleUrl: './help-page.scss'
})
export class HelpPageComponent {
  backClicked = output<void>();

  onBack() {
    this.backClicked.emit();
  }
}
