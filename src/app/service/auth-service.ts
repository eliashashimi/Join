import { computed, inject, Service, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { getInitials } from '../shared/contact-utils';

@Service()
export class AuthService {
  private readonly db = inject(Supabase).client;

  readonly user = signal<User | null>(null);
  readonly isGuest = computed(() => this.user()?.is_anonymous === true);
  readonly userName = computed<string | null>(() =>
    this.isGuest() ? null : (this.user()?.user_metadata['name'] ?? null),
  );
  readonly initials = computed(() => (this.isGuest() ? 'G' : getInitials(this.userName() ?? '')));


  constructor() {
    this.db.auth.onAuthStateChange((_event, session) => this.user.set(session?.user ?? null));
  }


  /**
   * Prüft, ob im Browser eine Sitzung gespeichert ist.
   * @returns `true`, wenn jemand angemeldet ist
   */
  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.db.auth.getSession();
    return data.session !== null;
  }


  /**
   * Meldet einen registrierten Nutzer an.
   * @param email die E-Mail-Adresse
   * @param password das Passwort
   * @throws den Fehler von Supabase, z. B. bei falschem Passwort
   */
  async login(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }


  /**
   * Meldet den Besucher als Gast an (anonymer Nutzer in Supabase).
   * @throws den Fehler von Supabase
   */
  async loginAsGuest(): Promise<void> {
    const { error } = await this.db.auth.signInAnonymously();
    if (error) throw error;
  }


  /**
   * Speichert einen neuen Namen im Konto. Avatar und Begrüßung zeigen ihn sofort.
   * @param name der neue Name
   * @throws den Fehler von Supabase
   */
  async updateName(name: string): Promise<void> {
    const { error } = await this.db.auth.updateUser({ data: { name } });
    if (error) throw error;
  }


  /** Meldet den Nutzer ab und löscht die Sitzung im Browser. */
  async logout(): Promise<void> {
    await this.db.auth.signOut();
  }
}
