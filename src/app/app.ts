import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactDetailComponent } from './features/contacts/contact-detail/contact-detail';
import { ContactsComponent } from './features/contacts/contacts/contacts';

@Component({
  imports: [RouterOutlet, ContactDetailComponent, ContactsComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Join');
}
