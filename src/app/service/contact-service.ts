import { inject, Service, signal } from '@angular/core';
import { ContactInterface, ContactRow } from '../interface/contact-interface';
import { Supabase } from './supabase';

/** Tabelle in Supabase. */
const TABLE = 'contacts';

/**
 * Lädt Kontakte aus Supabase.
 *
 * Die geladene Liste liegt zusätzlich im Signal `contacts`.
 *
 * Beispiel in einer Component:
 *   contactService = inject(ContactService);
 *   ngOnInit() { this.contactService.getContacts(); }
 *   Template: @for (contact of contactService.contacts(); track contact.id) { ... }
 */
@Service()
export class ContactService {
  private readonly db = inject(Supabase).client;
  private readonly contactList = signal<ContactInterface[]>([]);

  /** Alle geladenen Kontakte, alphabetisch nach Namen sortiert. */
  readonly contacts = this.contactList.asReadonly();

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
 * Berechnet die Initialen wie im Formular: erster Buchstabe des ersten und des
 * letzten Wortes, bei nur einem Wort die ersten zwei Buchstaben.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Sortiert alphabetisch nach Namen. */
function sortContacts(contacts: ContactInterface[]): ContactInterface[] {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
