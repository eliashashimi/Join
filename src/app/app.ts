import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactsComponent } from './features/contacts/contacts/contacts';
import { AddContact } from './features/contacts/contact-form/add-contact/add-contact';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Join');
}
