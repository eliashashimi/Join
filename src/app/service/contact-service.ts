import { inject, Service, signal } from '@angular/core';
import { ContactData, ContactInterface, ContactRow } from '../interface/contact-interface';
import { Supabase } from './supabase';
import { getInitials, randomColor } from '../shared/contact-utils';

/** Tabelle in Supabase. */
const TABLE = 'contacts';

/**
 * Lädt und löscht Kontakte in Supabase.
 *
 * Alle Funktionen sind async und werfen bei einem Fehler eine Exception,
 * also beim Aufruf `try { await ... } catch (error) { ... }` verwenden.
 *
 * Die geladene Liste liegt zusätzlich im Signal `contacts`. Es aktualisiert
 * sich nach jedem Löschen von selbst.
 *
 * Beispiel in einer Component:
 *   contactService = inject(ContactService);
 *   ngOnInit() { this.contactService.getContacts(); }
 *   Template: @for (contact of contactService.contacts(); track contact.id) { ... }
 *
 * Wichtig: Angular 22 aktualisiert die Ansicht nach einem `await` nicht von
 * selbst. Eigene Zustände wie isLoading oder hasError deshalb als `signal()`
 * anlegen, sonst bleibt die alte Anzeige stehen.
 */

@Service()
export class ContactService {
  private readonly db = inject(Supabase).client;
  private readonly contactList = signal<ContactInterface[]>([]);

  /** Alle geladenen Kontakte, alphabetisch nach Namen sortiert. */
  readonly contacts = this.contactList.asReadonly();
  showSuccessMessage = signal<boolean>(false);
  showDeletedMessage = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  triggerDeleteInDetail = signal<boolean>(false);

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
}

/** Übersetzt eine Datenbank-Zeile in einen Kontakt für die App. */
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

/**
 * Übersetzt Formulardaten in Datenbank-Spalten.
 * Felder, die nicht übergeben wurden, bleiben `undefined` und werden nicht gesendet.
 * Eine leere Telefonnummer wird als NULL gespeichert, eine leere Farbe ignoriert.
 */
function toRow(data: Partial<ContactData>): Partial<ContactRow> {
  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone === undefined ? undefined : data.phone?.trim() || null,
    color: data.color || undefined,
  };
}

/** Sortiert alphabetisch nach Namen. */
function sortContacts(contacts: ContactInterface[]): ContactInterface[] {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}