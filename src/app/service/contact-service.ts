import { inject, Service, signal } from '@angular/core';
import { ContactData, ContactInterface, ContactRow } from '../interface/contact-interface';
import { Supabase } from './supabase';
import { getInitials, randomColor } from '../shared/contact-utils';

const TABLE = 'contacts';

@Service()
export class ContactService {
  private readonly db = inject(Supabase).client;
  private readonly contactList = signal<ContactInterface[]>([]);

  readonly contacts = this.contactList.asReadonly();
  readonly currentUserId = signal<string | null>(null);
  showSuccessMessage = signal<boolean>(false);
  showDeletedMessage = signal<boolean>(false);
  showUpdatedMessage = signal<boolean>(false);
  showDeleteErrorMessage = signal<boolean>(false);
  showCannotDeleteMessage = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  /**
   * READ: Lädt alle Kontakte und legt sie im Signal `contacts` ab.
   * Merkt sich außerdem die ID des eingeloggten Users für die Löschrechte.
   * @returns die sortierte Kontaktliste
   */
  async getContacts(): Promise<ContactInterface[]> {
    await this.loadCurrentUser();
    const { data } = await this.db.from(TABLE).select('*').throwOnError();
    const contacts = sortContacts(data.map(toContact));
    this.contactList.set(contacts);
    return contacts;
  }

  /**
   * CREATE: Speichert einen neuen Kontakt. Er hat keine `user_id` und gilt daher als Dummy-Kontakt.
   * @param contact Daten aus dem Formular
   * @returns den gespeicherten Kontakt inklusive ID
   */
  async addContact(contact: ContactData): Promise<ContactInterface> {
    const row = { ...toRow(contact), color: contact.color || randomColor() };
    const { data } = await this.db.from(TABLE).insert(row).select().single().throwOnError();
    const created = toContact(data);
    this.contactList.update((list) => sortContacts([...list, created]));
    return created;
  }

  /**
   * UPDATE: Ändert einen vorhandenen Kontakt.
   * @param id ID des Kontakts
   * @param changes die geänderten Felder
   * @returns den geänderten Kontakt
   */
  async updateContact(id: string, changes: Partial<ContactData>): Promise<ContactInterface> {
    const query = this.db.from(TABLE).update(toRow(changes)).eq('id', id).select().maybeSingle();
    const { data } = await query.throwOnError();
    if (!data) throw new Error(`Kontakt ${id} wurde nicht gefunden.`);
    const updated = toContact(data);
    this.contactList.update((list) => sortContacts(list.map((c) => (c.id === id ? updated : c))));
    this.showUpdatedMessage.set(true);
    setTimeout(() => this.showUpdatedMessage.set(false), 3000);
    return updated;
  }

  /**
   * DELETE: Löscht einen Kontakt. Die Datenbank erlaubt das nur für den eigenen
   * Kontakt und für Dummy-Kontakte (siehe Delete-Policy).
   * Blockiert die Policy das Löschen, wirft Supabase keinen Fehler, sondern betrifft 0 Zeilen.
   * Deshalb werden die gelöschten Zeilen zurückgefragt und geprüft.
   * @param id ID des Kontakts
   */
  async deleteContact(id: string): Promise<void> {
    const { data } = await this.db.from(TABLE).delete().eq('id', id).select().throwOnError();
    if (!data || data.length === 0) throw new Error('Kontakt darf nicht gelöscht werden.');
    this.contactList.update((list) => list.filter((c) => c.id !== id));
  }

  /**
   * Löscht den eigenen Account samt Kontakt und meldet den User lokal ab.
   */
  async deleteOwnAccount(): Promise<void> {
    await this.db.rpc('delete_own_account').throwOnError();
    await this.db.auth.signOut({ scope: 'local' });
    this.contactList.set([]);
    this.currentUserId.set(null);
  }

  /**
   * Darf der eingeloggte User diesen Kontakt löschen? Erlaubt sind der eigene Kontakt
   * und Dummy-Kontakte ohne Account, nicht aber andere registrierte User.
   * @param contact der Kontakt
   * @returns `true`, wenn das Löschen erlaubt ist
   */
  canDelete(contact: ContactInterface): boolean {
    return !contact.userId || contact.userId === this.currentUserId();
  }

  /**
   * Prüft, ob der Kontakt zum eingeloggten User gehört.
   * @param id ID des Kontakts
   * @returns `true`, wenn es der eigene Kontakt ist
   */
  isOwnContact(id: string): boolean {
    const userId = this.currentUserId();
    return !!userId && this.contactList().some((c) => c.id === id && c.userId === userId);
  }

  /**
   * Prüft, ob die E-Mail-Adresse schon bei einem anderen Kontakt vergeben ist.
   * @param email die zu prüfende E-Mail-Adresse
   * @param exceptId ID des Kontakts, der beim Bearbeiten nicht mitzählt
   * @returns `true`, wenn die Adresse schon vergeben ist
   */
  isEmailTaken(email: string, exceptId?: string): boolean {
    const wanted = email.toLowerCase();
    return this.contactList().some((c) => c.id !== exceptId && c.email.toLowerCase() === wanted);
  }

  private async loadCurrentUser(): Promise<void> {
    const { data } = await this.db.auth.getSession();
    this.currentUserId.set(data.session?.user.id ?? null);
  }
}

function toContact(row: ContactRow): ContactInterface {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    color: row.color,
    initials: getInitials(row.name),
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(data: Partial<ContactData>): Partial<ContactRow> {
  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone === undefined ? undefined : data.phone?.trim() || null,
    color: data.color || undefined,
  };
}

function sortContacts(contacts: ContactInterface[]): ContactInterface[] {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}