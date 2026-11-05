import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
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

const INTRO_DELAY = 300;
const INTRO_DURATION = 1000;
const INTRO_EASING = 'ease-in-out';
const MOBILE_QUERY = '(max-width: 768px)';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  standalone: true,
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit, AfterViewInit {
  @ViewChild('logo', { static: true }) logoRef!: ElementRef<HTMLElement>;
  @ViewChild('overlay', { static: true }) overlayRef!: ElementRef<HTMLElement>;

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


  /** Startet die Intro-Animation, sobald die Seite im DOM steht. */
  ngAfterViewInit(): void {
    this.playIntro();
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


  /** Lässt das Logo aus der Mitte an seinen Platz im Header fahren und blendet das Overlay aus. */
  private async playIntro(): Promise<void> {
    const logo = this.logoRef.nativeElement;
    await Promise.all(
      Array.from(logo.querySelectorAll('img')).map((img) => img.decode().catch(() => {})),
    );
    logo.classList.add('visible');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return this.finishIntro();
    }
    const move = this.animateLogo(logo);
    this.fadeOverlay();
    this.fadeWhiteLogo(logo);
    move.finished.then(() => this.finishIntro()).catch(() => {});
  }


  /**
   * Das Logo startet in der Bildschirmmitte und fährt zu seiner echten Position im Header.
   * @param logo das Logo-Element im Header
   */
  private animateLogo(logo: HTMLElement): Animation {
    const end = logo.getBoundingClientRect();
    const startWidth = matchMedia(MOBILE_QUERY).matches ? 144 : 156;
    const scale = startWidth / end.width;
    const dx = document.documentElement.clientWidth / 2 - (end.left + end.width / 2);
    const dy = document.documentElement.clientHeight / 2 - (end.top + end.height / 2);
    return logo.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
        { transform: 'translate(0, 0) scale(1)' },
      ],
      { duration: INTRO_DURATION, delay: INTRO_DELAY, easing: INTRO_EASING, fill: 'both' },
    );
  }


  /** Blendet den Hintergrund aus. Zuerst bleibt er kurz stehen, dann verschwindet er. */
  private fadeOverlay(): void {
    this.overlayRef.nativeElement.animate(
      [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }],
      { duration: INTRO_DURATION, delay: INTRO_DELAY, easing: INTRO_EASING, fill: 'forwards' },
    );
  }


  /**
   * Mobile: Das weiße Logo blendet während des Flugs zum dunklen Logo über.
   * @param logo das Logo-Element im Header
   */
  private fadeWhiteLogo(logo: HTMLElement): void {
    const white = logo.querySelector<HTMLElement>('.logo-white');
    if (!white || getComputedStyle(white).display === 'none') return;
    white.animate(
      [{ opacity: 1 }, { opacity: 1, offset: 0.3 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }],
      { duration: INTRO_DURATION, delay: INTRO_DELAY, easing: INTRO_EASING, fill: 'forwards' },
    );
  }


  /** Räumt nach der Animation auf. Das Logo bleibt einfach stehen. */
  private finishIntro(): void {
    this.overlayRef.nativeElement.style.display = 'none';
    this.logoRef.nativeElement.querySelector('.logo-white')?.remove();
  }
}