import { Location } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Supabase } from '../../service/supabase';
import { capitalizeFirstLetter, EMAIL_REGEX, NAME_REGEX } from '../../shared/contact-utils';

const LOGIN_ROUTE = '/login';
const REDIRECT_DELAY_MS = 2000;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_TAKEN = 'email_exists';
const REQUIRED_MESSAGE = 'This field is required';
const MISMATCH_MESSAGE = "Your passwords don't match. Please try again.";
const GENERIC_SUBMIT_ERROR = 'Sign up failed. Please try again.';

type FieldName = 'name' | 'email' | 'password' | 'confirm';

const ERROR_MESSAGES: Record<FieldName, Record<string, string>> = {
  name: { pattern: 'Please enter a valid name' },
  email: {
    email: 'Please enter a valid email address',
    pattern: 'Please enter a valid email address',
  },
  password: { minlength: `Please use at least ${MIN_PASSWORD_LENGTH} characters` },
  confirm: {},
};

const EMAIL_ERRORS: Record<string, string> = {
  email_exists: 'This email is already registered',
  user_already_exists: 'This email is already registered',
  email_address_invalid: 'Please use a real email address',
  email_address_not_authorized: "We can't send a confirmation email to this address",
};

const SUBMIT_ERRORS: Record<string, string> = {
  weak_password: 'Please choose a stronger password',
  over_email_send_rate_limit: 'Too many attempts. Please try again later',
  over_request_rate_limit: 'Too many attempts. Please try again later',
  signup_disabled: 'Sign up is currently disabled',
  email_provider_disabled: 'Sign up is currently disabled',
};

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-signup',
  styleUrl: './signup.scss',
  templateUrl: './signup.html',
})
export class Signup {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly db = inject(Supabase).client;
  private redirectTimer?: ReturnType<typeof setTimeout>;

  isSubmitting = signal(false);
  showSuccess = signal(false);
  emailServerError = signal('');
  submitError = signal('');

  signupForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.pattern(NAME_REGEX)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REGEX)]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirm: ['', Validators.required],
      privacy: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.redirectTimer));
  }

  onBack(): void {
    this.location.back();
  }

  /**
   * Gibt den Fehlertext zu einem Feld zurück. Fehler erscheinen erst, wenn das Feld
   * verlassen wurde, damit niemand beim Tippen schon Fehler sieht.
   * @param field Name des Feldes
   * @returns den Text oder einen leeren String, wenn es nichts zu melden gibt
   */
  errorMessage(field: FieldName): string {
    const control = this.signupForm.controls[field];
    if (field === 'email' && this.emailServerError()) return this.emailServerError();
    if (!control.touched) return '';
    if (control.hasError('required')) return REQUIRED_MESSAGE;
    if (field === 'confirm' && this.signupForm.hasError('passwordMismatch')) return MISMATCH_MESSAGE;
    return ERROR_MESSAGES[field][Object.keys(control.errors ?? {})[0]] ?? '';
  }

  clearServerErrors(): void {
    this.emailServerError.set('');
    this.submitError.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid || this.isSubmitting()) return;
    this.clearServerErrors();
    this.isSubmitting.set(true);
    try {
      await this.createAccount();
      this.showSuccessAndLeave();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Erstellt das Konto in Supabase Auth. Der Name wird als user_metadata gespeichert.
   * Ist die E-Mail-Adresse schon registriert, wirft die Funktion einen Fehler mit dem Code `email_exists`.
   */
  private async createAccount(): Promise<void> {
    const { name, email, password } = this.signupForm.getRawValue();
    const { data, error } = await this.db.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: capitalizeFirstLetter(name.trim()) } },
    });
    if (error) throw error;
    if (data.user?.identities?.length === 0) throw { code: EMAIL_TAKEN };
    // Ohne E-Mail-Bestätigung loggt signUp sofort ein, im Figma folgt aber der Login
    if (data.session) await this.db.auth.signOut({ scope: 'local' });
  }

  private showSuccessAndLeave(): void {
    this.showSuccess.set(true);
    this.redirectTimer = setTimeout(() => this.router.navigate([LOGIN_ROUTE]), REDIRECT_DELAY_MS);
  }

  /**
   * Zeigt den passenden Fehler und gibt den Button wieder frei. Den echten Grund von Supabase
   * gibt es zusätzlich in der Konsole, damit man bei einem Fehler nicht raten muss.
   * @param error Fehler aus createAccount
   */
  private handleError(error: unknown): void {
    const code = (error as { code?: string })?.code ?? '';
    console.error('Sign up failed:', error);
    if (EMAIL_ERRORS[code]) this.emailServerError.set(EMAIL_ERRORS[code]);
    else this.submitError.set(SUBMIT_ERRORS[code] ?? GENERIC_SUBMIT_ERROR);
    this.isSubmitting.set(false);
  }
}

/**
 * Prüft, ob Passwort und Wiederholung übereinstimmen. Eine leere Wiederholung ist kein Fehler,
 * sie meldet schon das Feld selbst ("This field is required").
 * @param form das ganze Formular
 * @returns `{ passwordMismatch: true }`, wenn die Passwörter nicht gleich sind, sonst `null`
 */
function passwordsMatch(form: AbstractControl): ValidationErrors | null {
  const { password, confirm } = form.value;
  return confirm && password !== confirm ? { passwordMismatch: true } : null;
}