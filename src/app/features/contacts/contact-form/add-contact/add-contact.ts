import { Component, inject, signal, output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../../../../service/supabase';
import { ContactData } from '../../../../interface/contact-interface';
import { ContactService } from '../../../../service/contact-service';

const Name_Regex =
  /^[a-zA-ZäöüÄÖÜßàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+(\s+[a-zA-ZäöüÄÖÜßàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ-]+)+$/;
const Email_Regex = '^[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\\.[a-z]{2,4}$';
const Phone_Regex = '^[+]?[0-9\\s/-]{3,20}$';

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
  isSubmitting = signal(false);
  closeModal = output<void>();
  contactCreated = output<string>();
  contactService = inject(ContactService);
  emailExistingError = signal<boolean>(false);

  close() {
    this.closeModal.emit();
  }

  userform = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(Name_Regex)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(Email_Regex)]],
    phone: ['', [Validators.required, Validators.pattern(Phone_Regex)]],
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
    this.isSubmitting.set(false);
    this.close();
  }

  private handleDuplicateEmailError(error: any): void {
    const isDuplicate =
      error.message?.toLowerCase().includes('unique_email') || error.code === '23505';
    if (isDuplicate) {
      this.emailExistingError.set(true);
    } else {
      console.log('Ein unerwarteter Datenbank-Fehler ist aufgetreten: ', error.message);
    }
    this.isSubmitting.set(false);
  }

  private handleSuccess(contactId: string) {
    this.contactService.showSuccessMessage.set(true);
    this.resetAndCloseForm();
    this.contactCreated.emit(contactId);
    setTimeout(() => this.contactService.showSuccessMessage.set(false), 3000);
  }

  async onSubmit() {
    this.formSubmitted.set(true);
    this.emailExistingError.set(false);
    if (!this.userform.valid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      const createdContact = await this.contactService.addContact(this.getFormData());
      this.handleSuccess(createdContact.id);
    } catch (error: any) {
      this.handleDuplicateEmailError(error);
    }
  }
}
