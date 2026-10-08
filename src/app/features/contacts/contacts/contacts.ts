import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Contact as ContactModel, GroupedContacts } from '../../../interfaces/contact';
import { ContactDetailComponent } from '../contact-detail/contact-detail';

@Component({
  imports: [CommonModule,ContactDetailComponent],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class ContactsComponent {
  private contacts = signal<ContactModel[]>([
    { id: 1, name: 'Anton Mayer', email: 'antonm@gmail.com', phone: '+49 111 223344', initials: 'AM', color: '#ff7a00' },
    { id: 2, name: 'Anja Schulz', email: 'schulz@hotmail.com', phone: '+49 222 334455', initials: 'AS', color: '#6c5ce7' },
    { id: 3, name: 'Benedikt Ziegler', email: 'benedikt@gmail.com', phone: '+49 333 445566', initials: 'BZ', color: '#00cec9' },
    { id: 4, name: 'David Eisenberg', email: 'davideberg@gmail.com', phone: '+49 444 556677', initials: 'DE', color: '#fd79a8' },
    { id: 5, name: 'Eva Fischer', email: 'eva@gmail.com', phone: '+49 555 667788', initials: 'EF', color: '#fab1a0' },
    { id: 6, name: 'Emmanuel Mauer', email: 'emmanuelma@gmail.com', phone: '+49 666 778899', initials: 'EM', color: '#e17055' }
  ]);

  selectedContact = signal<ContactModel | null>(null);

  // Automatische Gruppierung nach Anfangsbuchstaben (A, B, D, E, M...)
  groupedContacts = computed<GroupedContacts[]>(() => {
    const map = new Map<string, ContactModel[]>();
    
    for (const c of this.contacts()) {
      const letter = c.name.charAt(0).toUpperCase();
      if (!map.has(letter)) {
        map.set(letter, []);
      }
      map.get(letter)!.push(c);
    }

    // Sortiere die Gruppen alphabetisch nach Buchstaben
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, contacts]) => ({ letter, contacts }));
  });
}
