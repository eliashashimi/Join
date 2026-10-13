import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ContactInterface, GroupedContacts } from '../../../interface/contact-interface';
import { ContactDetailComponent } from '../contact-detail/contact-detail';
import { AddContact } from '../contact-form/add-contact/add-contact';
import { EditContact } from '../contact-form/edit-contact/edit-contact';
import { ContactService } from '../../../service/contact-service';
import { Toast } from '../../../shared/toast/toast';

@Component({
  imports: [CommonModule, ContactDetailComponent, AddContact, EditContact, Toast],
  selector: 'app-contacts',
  standalone: true,
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class ContactsComponent implements OnInit {
  selectedContactId = signal<string | null>(null);
  showAddContactModal = signal<boolean>(false);
  showEditContactModal = signal<boolean>(false);
  showMobileMenu = signal<boolean>(false);
  loadError = signal<boolean>(false);

  private contactService = inject(ContactService);
  contacts = this.contactService.contacts;

  /** Berechnet den aktuell ausgewählten Kontakt anhand der ID. */
  selectedContact = computed(() => {
    const id = this.selectedContactId();
    if (!id) return null;
    return this.contacts().find((c) => c.id === id) || null;
  });

  /** Lädt beim Initialisieren die Kontakte und merkt sich einen Ladefehler. */
  async ngOnInit(): Promise<void> {
    try {
      await this.contactService.getContacts();
    } catch {
      this.loadError.set(true);
    }
  }

  /** Gruppiert und sortiert alle Kontakte alphabetisch nach Anfangsbuchstaben. */
  groupedContacts = computed<GroupedContacts[]>(() => {
    const map = new Map<string, ContactInterface[]>();
    for (const c of this.contacts()) {
      const letter = c.name.charAt(0).toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(c);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, contacts]) => ({ letter, contacts }));
  });

  /** Prüft, ob die mobile Detailansicht geöffnet ist. */
  isMobileDetailOpen = computed(() => this.selectedContactId() !== null);

  /** Setzt die Auswahl zurück und schließt das mobile Menü. */
  goBackToList(): void {
    this.selectedContactId.set(null);
    this.showMobileMenu.set(false);
  }

  /**
   * Setzt den neu erstellten Kontakt als aktiv.
   * @param contactId ID des neuen Kontakts
   */
  onContactCreated(contactId: string): void {
    this.selectedContactId.set(contactId);
  }

  /** Schaltet das mobile Menü um. */
  toggleMobileMenu(): void {
    this.showMobileMenu.update((val) => !val);
  }

  /** Öffnet das Bearbeitungsmodal für Kontakte. */
  openEditModal(): void {
    this.showEditContactModal.set(true);
    this.showMobileMenu.set(false);
  }

  /** Bereitet das Löschen des Kontakts vor. */
  async onDeleteContact(): Promise<void> {
    const contact = this.selectedContact();
    if (!contact?.id) return;
    this.showMobileMenu.set(false);
    await this.executeContactDeletion(contact.id);
  }

  /**
   * Löscht den Kontakt, setzt die Auswahl sofort zurück und blendet die Meldung nach 3 Sekunden aus.
   * @param id ID des Kontakts
   */
  private async executeContactDeletion(id: string): Promise<void> {
    try {
      await this.contactService.deleteContact(id);
      this.selectedContactId.set(null);
      this.contactService.showDeletedMessage.set(true);
      setTimeout(() => this.contactService.showDeletedMessage.set(false), 3000);
    } catch (err) {
      console.error('Fehler beim Löschen des Kontakts:', err);
    }
  }
}