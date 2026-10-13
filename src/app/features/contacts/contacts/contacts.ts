import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactInterface, GroupedContacts } from '../../../interface/contact-interface';
import { ContactDetailComponent } from '../contact-detail/contact-detail';
import { AddContact } from '../contact-form/add-contact/add-contact';
import { EditContact } from '../contact-form/edit-contact/edit-contact';
import { ContactService } from '../../../service/contact-service';
import { HelpPageComponent } from '../../help-page/help-page';
import { LegalNotice } from '../../legal-notice/legal-notice';
import { PrivacyPolicy } from '../../privacy-policy/privacy-policy';

@Component({
  imports: [
    CommonModule, 
    RouterLink, 
    ContactDetailComponent, 
    AddContact, 
    EditContact, 
    HelpPageComponent, 
    LegalNotice, 
    PrivacyPolicy
  ],
  selector: 'app-contacts',
  standalone: true,
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class ContactsComponent implements OnInit {

  currentView = signal<'contacts' | 'help' | 'legal' | 'privacy'>('contacts');

  selectedContactId = signal<string | null>(null);
  showAddContactModal = signal<boolean>(false);
  showEditContactModal = signal<boolean>(false);
  showMobileMenu = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);
  private contactService = inject(ContactService);

  contacts = this.contactService.contacts;

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

  isMobileDetailOpen = computed(() => this.selectedContactId() !== null);

  goBackToList(): void {
    this.selectedContactId.set(null);
    this.showMobileMenu.set(false);
  }

  onContactCreated(contactId: string): void {
    this.selectedContactId.set(contactId);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(val => !val);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update((open) => !open);
  }

  openView(view: 'help' | 'legal' | 'privacy'): void {
    this.currentView.set(view);
    this.showUserMenu.set(false);
  }

  openEditModal(): void {
    this.showEditContactModal.set(true);
    this.showMobileMenu.set(false);
  }

  async onDeleteContact(): Promise<void> {
    const contact = this.selectedContact();
    if (!contact || !contact.id) return;

    this.showMobileMenu.set(false);
    
    try {
      await this.contactService.deleteContact(contact.id);
      this.contactService.showDeletedMessage.set(true);
      setTimeout(() => {
        this.selectedContactId.set(null); // Zurück zur Liste nach Löschung
        this.contactService.showDeletedMessage.set(false);
      }, 3000);
    } catch (err) {
      console.error('Fehler beim Löschen des Kontakts:', err);
    }
  }
}