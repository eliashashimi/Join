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
  selector: 'app-add-contact',
  styleUrl: './add-contact.scss',
  templateUrl: './add-contact.html',
})
export class AddContact {
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

  onSubmit() {
    this.formSubmitted.set(true);

    if (this.userform.valid) {
      const emailText = this.userform.value.email;
      if (emailText)
        this.userform.patchValue({
          email: emailText?.toLowerCase().trim(),
        });
      this.userform.reset();
      this.formSubmitted.set(false);
    }
  }
}
