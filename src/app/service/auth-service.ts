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


  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.db.auth.getSession();
    return data.session !== null;
  }


  async login(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }


  async loginAsGuest(): Promise<void> {
    const { error } = await this.db.auth.signInAnonymously();
    if (error) throw error;
  }


  async logout(): Promise<void> {
    await this.db.auth.signOut();
  }
}
