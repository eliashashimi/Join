import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-signup',
  styleUrl: './signup.scss',
  templateUrl: './signup.html',
})
export class Signup {
  private location = inject(Location);

  onBack(): void {
    this.location.back();
  }
}
