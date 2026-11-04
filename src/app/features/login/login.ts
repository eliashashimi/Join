import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';

const LOGIN_ERROR = 'Check your email and password. Please try again.';
const GUEST_ERROR = 'Guest log in failed. Please try again.';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  standalone: true,
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  rememberMe: boolean = false;
  isLoading = signal(false);
  loginError = signal('');
  showPassword = false;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {}


  /** Zeigt oder versteckt das Passwort (Klick auf das Auge). */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }


  /** Baut beim Öffnen der Seite das Login-Formular auf. */
  ngOnInit(): void {
    this.initForm();
  }


  /**
   * Erstellt das Formular mit E-Mail und Passwort. Sobald getippt wird, verschwindet die Fehlermeldung.
   */
  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError()) {
        this.loginError.set('');
      }
    });
  }


  /** Prüft das Formular und meldet den Nutzer mit E-Mail und Passwort an. */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.value;
    this.runLogin(() => this.auth.login(email, password), LOGIN_ERROR);
  }


  /** Meldet den Besucher als Gast an. */
  guestLogin(): void {
    this.runLogin(() => this.auth.loginAsGuest(), GUEST_ERROR);
  }


  /**
   * Führt einen Login aus und sperrt dabei die Buttons. Danach geht es zur Summary, bei einem Fehler erscheint die Meldung.
   * @param login die Login-Funktion (mit Passwort oder als Gast)
   * @param errorText der Text, der bei einem Fehler angezeigt wird
   */
  private async runLogin(login: () => Promise<void>, errorText: string): Promise<void> {
    this.isLoading.set(true);
    this.loginError.set('');
    try {
      await login();
      this.router.navigate(['/summary']);
    } catch (error) {
      this.loginError.set(errorText);
    } finally {
      this.isLoading.set(false);
    }
  }
}
