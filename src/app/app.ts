import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditContact } from './features/contacts/contact-form/edit-contact/edit-contact';
import { AddContact } from './features/contacts/contact-form/add-contact/add-contact';
import { ContactDetailComponent } from './features/contacts/contact-detail/contact-detail';

@Component({
  imports: [RouterOutlet, EditContact, AddContact, ContactDetailComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Join');
}
