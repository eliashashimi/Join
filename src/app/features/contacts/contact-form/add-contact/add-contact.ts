import { Component, inject, signal, output } from '@angular/core';
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
import { Supabase } from '../../../../service/supabase';
import { ContactData } from '../../../../interface/contact-interface';
import { ContactService } from '../../../../service/contact-service';

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
  supabase = inject(Supabase);
  formSubmitted = signal(false);
  closeModal = output<void>();
  contactService = inject(ContactService);

  close() {
    this.closeModal.emit();
  }

  userform = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern('^[a-zA-ZäöüÄÖÜß]{2,}(?:[- ][a-zA-ZäöüÄÖÜß]{2,})*$'),
      ],
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\\.[a-z]{2,4}$'),
      ],
    ],
    phone: [
      '',
      [Validators.required, Validators.pattern('^(?!^(\\d)\\1+$)(?!^\\s+$)[+0-9\\s/-]{3,20}$')],
    ],
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

  getInitials(): string {
    const nameValue = this.name?.value;
    if (!nameValue || !nameValue?.trim()) return '';
    const parts = nameValue.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    const firstinitial = parts[0].charAt(0);
    const lastinitial = parts[parts.length - 1].charAt(0);
    return (firstinitial + lastinitial).toUpperCase();
  }

  getBackground(): string {
    const nameValue = this.name?.value;
    if (!nameValue || nameValue.trim().length < 2) {
      return '#cccccc';
    }
    let hash = 0;
    for (let i = 0; i < nameValue.length; i++) {
      hash = nameValue.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash % 360);
    return `hsl(${color}, 70%, 45%)`;
  }

  private getFormData(): ContactData {
    return {
      name: this.userform.value.name?.trim() || '',
      email: this.userform.value.email?.toLowerCase().trim() || '',
      phone: this.userform.value.phone?.trim() || '',
    };
  }

  private resetAndCloseForm(): void {
    this.userform.reset();
    this.formSubmitted.set(false);
    this.close();
  }

  async onSubmit() {
    console.log('onSubmit wurde ausgelöst');
    this.formSubmitted.set(true);

    if (!this.userform.valid) {
      return;
    }
    try {
      const newContactData = this.getFormData();
      await this.contactService.addContact(newContactData);
      this.contactService.showSuccessMessage.set(true);
      this.resetAndCloseForm();
      setTimeout(() => {
        this.contactService.showSuccessMessage.set(false);
      }, 3000);
    } catch (error: any) {
      console.error('contact couldn´t be created');
    }
  }
}
