import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  HostListener,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ContactInterface, GroupedContacts } from '../../../interface/contact-interface';
import { ContactDetailComponent } from '../contact-detail/contact-detail';
import { AddContact } from '../contact-form/add-contact/add-contact';
import { EditContact } from '../contact-form/edit-contact/edit-contact';
import { ContactService } from '../../../service/contact-service';
import { Toast } from '../../../shared/toast/toast';
import { DeleteConfirm } from '../../../shared/delete-confirm/delete-confirm';

const DELETE_TEXTS = {
  contact: { title: 'Delete contact', message: 'Are you sure you want to delete this contact?' },
  account: {
    title: 'Delete your account',
    message: 'Your account and your contact will be deleted and you will be logged out.',
  },
};

@Component({
  imports: [CommonModule, ContactDetailComponent, AddContact, EditContact, Toast, DeleteConfirm],
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
  private router = inject(Router);
  contacts = this.contactService.contacts;

  selectedContact = computed(() => {
    const id = this.selectedContactId();
    if (!id) return null;
    return this.contacts().find((c) => c.id === id) || null;
  });

  /** Ist der gewählte Kontakt löschbar (eigener Kontakt oder Dummy-Kontakt)? */
  canDeleteSelected = computed(() => {
    const contact = this.selectedContact();
    return !!contact && this.contactService.canDelete(contact);
  });

  /** Texte für den Lösch-Dialog. Beim eigenen Kontakt warnt er, dass der ganze Account gelöscht wird. */
  deleteText = computed(() => {
    const id = this.selectedContactId();
    return id && this.contactService.isOwnContact(id) ? DELETE_TEXTS.account : DELETE_TEXTS.contact;
  });

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

  isMobileDetailOpen = computed(() => this.selectedContactId() !== null);


  /** Lädt beim Öffnen der Seite alle Kontakte. Klappt das nicht, erscheint ein Hinweis. */
  async ngOnInit(): Promise<void> {
    try {
      await this.contactService.getContacts();
    } catch {
      this.loadError.set(true);
    }
  }


  /**
   * Schließt das mobile Menü, wenn außerhalb davon geklickt wird.
   * @param event der Klick auf der Seite
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showMobileMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-fab-wrapper')) {
        this.showMobileMenu.set(false);
      }
    }
  }


  /**
   * Prüft, ob der Kontakt zum eingeloggten User gehört. In der Liste steht dann „(You)“ hinter dem Namen.
   * @param contact Kontakt aus der Liste
   * @returns `true` beim eigenen Kontakt
   */
  isOwnContact(contact: ContactInterface): boolean {
    return this.contactService.isOwnContact(contact.id);
  }


  /** Geht in der mobilen Ansicht vom Kontakt zurück zur Liste. */
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


  /** Öffnet oder schließt das mobile Menü des Kontakts. */
  toggleMobileMenu(): void {
    this.showMobileMenu.update((val) => !val);
  }


  /** Öffnet das Bearbeiten-Formular und schließt das mobile Menü. */
  openEditModal(): void {
    this.showEditContactModal.set(true);
    this.showMobileMenu.set(false);
  }


  /**
   * Öffnet den Lösch-Dialog, aber nur für Kontakte, die der User löschen darf.
   * Sonst wird die Meldung "kann nicht gelöscht werden" angezeigt.
   */
  onDeleteContact(): void {
    this.showMobileMenu.set(false);
    if (!this.canDeleteSelected()) {
      this.showMessage(this.contactService.showCannotDeleteMessage);
      return;
    }
    this.contactService.showDeleteModal.set(true);
  }


  /** Löscht den gewählten Kontakt, nachdem im Dialog bestätigt wurde. */
  async confirmDelete(): Promise<void> {
    const id = this.selectedContactId();
    this.contactService.showDeleteModal.set(false);
    if (id) await this.executeContactDeletion(id);
  }


  /**
   * Löscht den Kontakt. Ist es der eigene, wird der ganze Account gelöscht und zum Login weitergeleitet.
   * @param id ID des Kontakts
   */
  private async executeContactDeletion(id: string): Promise<void> {
    try {
      if (this.contactService.isOwnContact(id)) {
        await this.contactService.deleteOwnAccount();
        await this.router.navigate(['/login']);
        return;
      }
      await this.contactService.deleteContact(id);
      this.selectedContactId.set(null);
      this.showMessage(this.contactService.showDeletedMessage);
    } catch {
      this.showMessage(this.contactService.showDeleteErrorMessage);
    }
  }


  /**
   * Zeigt eine Meldung und blendet sie nach 3 Sekunden wieder aus.
   * @param flag Signal der Meldung
   */
  private showMessage(flag: WritableSignal<boolean>): void {
    flag.set(true);
    setTimeout(() => flag.set(false), 3000);
  }
}