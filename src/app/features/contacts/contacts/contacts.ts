import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactInterface, GroupedContacts } from '../../../interface/contact-interface';
import { ContactDetailComponent } from '../contact-detail/contact-detail';
import { AddContact } from '../contact-form/add-contact/add-contact';
import { EditContact } from '../contact-form/edit-contact/edit-contact';
import { ContactService } from '../../../service/contact-service';

@Component({
  imports: [CommonModule, RouterLink, ContactDetailComponent, AddContact, EditContact],
  selector: 'app-contacts',
  standalone: true,
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class ContactsComponent implements OnInit {
  showAddContactModal = signal(false);
  showEditContactModal = signal(false);
  private contactService = inject(ContactService);

  contacts = this.contactService.contacts;

  selectedContactId = signal<string | null>(null);

  selectedContact = computed(() => {
    const id = this.selectedContactId();
    if (!id) return null;
    return this.contacts().find((c) => c.id === id) || null;
  });

  async ngOnInit() {
    await this.contactService.getContacts();
  }

  groupedContacts = computed<GroupedContacts[]>(() => {
    const map = new Map<string, ContactInterface[]>();

    for (const c of this.contacts()) {
      const letter = c.name.charAt(0).toUpperCase();
      if (!map.has(letter)) {
        map.set(letter, []);
      }
      map.get(letter)!.push(c);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, contacts]) => ({ letter, contacts }));
  });
}
