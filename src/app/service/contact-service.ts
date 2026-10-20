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
  showSuccessMessage = signal<boolean>(false);
  showDeletedMessage = signal<boolean>(false);
  showUpdatedMessage = signal<boolean>(false);
  showDeleteErrorMessage = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  /**
   * READ: Lädt alle Kontakte und legt sie im Signal `contacts` ab.
   * @returns die sortierte Kontaktliste
   */
  async getContacts(): Promise<ContactInterface[]> {
    const { data } = await this.db.from(TABLE).select('*').throwOnError();
    const contacts = sortContacts(data.map(toContact));
    this.contactList.set(contacts);
    return contacts;
  }

  /**
   * READ: Lädt einen einzelnen Kontakt.
   * @param id ID des Kontakts
   * @returns den Kontakt oder `null`, wenn es die ID nicht gibt
   */
  async getContactById(id: string): Promise<ContactInterface | null> {
    const { data } = await this.db
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .throwOnError();
    return data ? toContact(data) : null;
  }

  /**
   * CREATE: Speichert einen neuen Kontakt.
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
   * DELETE: Löscht einen Kontakt.
   * @param id ID des Kontakts
   */
  async deleteContact(id: string): Promise<void> {
    await this.db.from(TABLE).delete().eq('id', id).throwOnError();
    this.contactList.update((list) => list.filter((c) => c.id !== id));
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
}

function toContact(row: ContactRow): ContactInterface {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    color: row.color,
    initials: getInitials(row.name),
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
