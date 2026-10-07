import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditContact } from './features/contacts/contact-form/edit-contact/edit-contact';

@Component({
  imports: [RouterOutlet, EditContact],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Join');
}
