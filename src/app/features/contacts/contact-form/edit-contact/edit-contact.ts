import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormArray,
  Validators,
  ValidationErrors,
  AbstractControl,
  ValidatorFn,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';

export function forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = nameRe.test(control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-edit-contact',
  styleUrl: './edit-contact.scss',
  templateUrl: './edit-contact.html',
})
export class EditContact {
  fb = inject(FormBuilder);
  router = inject(Router);
  formSubmitted = signal(false);

  userform = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(4), forbiddenNameValidator(/ /)]],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._+-]+@[a-zA-Z0-9,-]+\\.[a-z]{2,4}$'),
      ],
    ],
    phone: ['', [Validators.required, Validators.pattern('^[+0-9]+[0-9]')]],
  });

  get name() {
    return this.userform.get('name');
  }

  get email() {
    return this.userform.get('email');
  }

  get phone() {
    return this.userform.get('phone');
  }

  getInitials() {
    const nameValue = this.name?.value;
    if (!nameValue) return '';
    const parts = nameValue.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    const firstinitial = parts[0].charAt(0);
    const lastinitial = parts[parts.length - 1].charAt(0);
    return firstinitial + lastinitial;
  }

  getBackground() {
    const nameValue = this.name?.value;
    if (!nameValue || nameValue.trim().length < 2) {
      return '#cccccc';
    }
    let hash = 0;
    for (let i = 0; i < nameValue.length; i++) {
      hash = nameValue.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash % 360);
    return `hsl(${color}), 75%, 45%`;
  }

  onSubmit() {
    this.formSubmitted.set(true);

    if (this.userform.valid) {
      const nameText = this.userform.value.name;
      const emailText = this.userform.value.email;
      if (emailText)
        this.userform.patchValue({
          name: nameText?.trim(),
          email: emailText?.toLowerCase().trim(),
        });
      this.userform.reset();
      this.formSubmitted.set(false);
    }
  }
}
