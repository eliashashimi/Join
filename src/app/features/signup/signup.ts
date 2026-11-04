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
  showPassword = signal(false);
  showConfirm = signal(false);
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
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.redirectTimer);
      // Entfernt, da es beim Navigieren zwischendurch die Daten löscht
    });
    this.loadFormDataFromLocalStorage();
    this.setupLocalStorageListeners();
  }

  /**
   * Lädt die Formulardaten aus dem localStorage und füllt sie in das Formular ein.
   * Wird beim Initialisieren der Komponente aufgerufen.
   */
  private loadFormDataFromLocalStorage(): void {
    const savedFormData = localStorage.getItem('signupFormData');
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        // Füllt die Form Controls nur mit gesperrten Werten (sichere Methode)
        Object.keys(formData).forEach(key => {
          const control = this.signupForm.get(key);
          if (control && formData[key] !== null && formData[key] !== undefined) {
            control.setValue(formData[key], { emitEvent: false });
          }
        });
      } catch (error) {
        console.error('Fehler beim Laden der Formulardaten:', error);
        localStorage.removeItem('signupFormData');
      }
    }
  }

  /**
   * Überprüft, ob Formular-Tracking für Safari/Chrome unterstützt wird und überprüft die gespeicherten Daten.
   * @returns true, wenn LocalStorage unterstützt wird, sonst false
   */
  private verifyStorageSupport(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage wird nicht unterstützt:', error);
      return false;
    }
  }

  /**
   * Richtet die Listener für das Speichern der Formulardaten im localStorage ein.
   * Überwacht Änderungen in allen Form Controls.
   */
  private setupLocalStorageListeners(): void {
    // Überwacht Änderungen in jedem Form Control
    this.signupForm.valueChanges.subscribe(value => {
      this.saveFormDataToLocalStorage(value);
    });

    // Speichert auch bei direktem localStorage-Ereignis (Tab-Wechsel)
    const saveOnStorageChange = (event: StorageEvent) => {
      if (event.key === 'signupFormData') {
        this.loadFormDataFromLocalStorage();
      }
    };
    window.addEventListener('storage', saveOnStorageChange);
  }

  /**
   * Speichert die Formulardaten im localStorage.
   * @param value Die aktuellen Formwerte
   */
  private saveFormDataToLocalStorage(value: any): void {
    try {
      // Erstellt eine sichere Kopie ohne sensitive Daten (wie Passwörter)
      const safeValue = {
        name: value.name || '',
        email: value.email || '',
        privacy: value.privacy || false
      };
      localStorage.setItem('signupFormData', JSON.stringify(safeValue));
    } catch (error) {
      console.error('Fehler beim Speichern der Formulardaten:', error);
    }
  }

  /**
   * Löscht die Formulardaten aus dem localStorage.
   * Wird nach erfolgreicher Formularübermittlung aufgerufen.
   */
  private clearFormDataFromLocalStorage(): void {
    localStorage.removeItem('signupFormData');
  }

  /**
   * Zeigt oder versteckt die Eingabe eines Passwortfeldes (Klick auf das Auge).
   * @param field das Passwortfeld, dessen Anzeige gewechselt wird
   */
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    const visible = field === 'password' ? this.showPassword : this.showConfirm;
    visible.update((shown) => !shown);
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
   * Leitet den Zugriff auf die Privacy Policy und Legal Notice weiter.
   * Speichert die Formulardaten und navigiert zur entsprechenden Seite.
   */
  navigateTo(route: '/privacy-policy' | '/legal-notice'): void {
    this.saveFormDataToLocalStorage(this.signupForm.value);
    this.router.navigate([route]);
  }

  /**
   * Navigiert explizit zurück zur Login-Seite.
   */
  onBack(): void {
    this.router.navigate([LOGIN_ROUTE]);
  }

  /**
   * Speichert die Formulardaten und navigiert zurück zur Signup-Formularseite.
   * @param route Die Route, zur der navigiert werden soll (Standard: '/signup')
   */
  navigateBack(route: string = '/signup'): void {
    this.saveFormDataToLocalStorage(this.signupForm.value);
    this.router.navigate([route]);
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
    if (data.session) await this.db.auth.signOut({ scope: 'local' });
  }

  private showSuccessAndLeave(): void {
    this.showSuccess.set(true);
    this.clearFormDataFromLocalStorage();
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