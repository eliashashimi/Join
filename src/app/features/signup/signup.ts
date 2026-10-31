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
const EMAIL_TAKEN = 'user_already_exists';
const REQUIRED_MESSAGE = 'This field is required';
const EMAIL_TAKEN_MESSAGE = 'This email is already registered';
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

const SUBMIT_ERRORS: Record<string, string> = {
  weak_password: 'Please choose a stronger password',
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
  emailTaken = signal(false);
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
    if (field === 'email' && this.emailTaken()) return EMAIL_TAKEN_MESSAGE;
    if (!control.touched) return '';
    if (control.hasError('required')) return REQUIRED_MESSAGE;
    if (field === 'confirm' && this.signupForm.hasError('passwordMismatch')) return MISMATCH_MESSAGE;
    return ERROR_MESSAGES[field][Object.keys(control.errors ?? {})[0]] ?? '';
  }

  clearServerErrors(): void {
    this.emailTaken.set(false);
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
   * Ist die E-Mail-Adresse schon registriert, wirft die Funktion einen Fehler mit dem Code `user_already_exists`.
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
  }

  private showSuccessAndLeave(): void {
    this.showSuccess.set(true);
    this.redirectTimer = setTimeout(() => this.router.navigate([LOGIN_ROUTE]), REDIRECT_DELAY_MS);
  }

  /**
   * Zeigt den passenden Fehler und gibt den Button wieder frei.
   * @param error Fehler aus createAccount
   */
  private handleError(error: unknown): void {
    const code = (error as { code?: string })?.code ?? '';
    if (code === EMAIL_TAKEN) this.emailTaken.set(true);
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