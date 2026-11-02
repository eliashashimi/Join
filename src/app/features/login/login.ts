import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Login abgesendet:', email, password);
      this.router.navigate(['/summary']);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  guestLogin(): void {
    console.log('Als Gast eingeloggt - Eingeschränkte Rechte');
    localStorage.setItem('user_role', 'guest');
    this.router.navigate(['/summary']);
  }
}
