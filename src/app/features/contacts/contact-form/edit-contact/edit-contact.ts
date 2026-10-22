import { Component, inject, signal, input, output, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactData, ContactInterface } from '../../../../interface/contact-interface';
import { ContactService } from '../../../../service/contact-service';
import {
  EMAIL_REGEX,
  NAME_REGEX,
  PHONE_REGEX,
  getInitials as initialsOf,
  isDuplicateEmail,
  capitalizeFirstLetter,
} from '../../../../shared/contact-utils';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-edit-contact',
  styleUrl: './edit-contact.scss',
  templateUrl: './edit-contact.html',
})
export class EditContact {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  formSubmitted = signal(false);
  isSubmitting = signal(false);
  emailExistingError = signal<boolean>(false);
  submitError = signal('');
  contactColor = signal('#cccccc');
  contactId = input.required<string>();
  closeModal = output<void>();
  isClosing = signal(false);

  userform = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(NAME_REGEX)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REGEX)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_REGEX)]],
  });

  constructor() {
    effect(() => {
      const contact = this.contactService.contacts().find((c) => c.id === this.contactId());
      if (contact) this.applyContactData(contact);
    });
  }

  get name() {
    return this.userform.get('name');
  }

  get email() {
    return this.userform.get('email');
  }

  get phone() {
    return this.userform.get('phone');
  }

  onDeleteClick(): void {
    this.contactService.showDeleteModal.set(true);
    this.close();
  }

  close(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);

    setTimeout(() => {
      this.closeModal.emit();
      this.isClosing.set(false);
    }, 250);
  }

  /**
   * Übernimmt die Daten des Kontakts ins Formular.
   * @param contact der geladene Kontakt
   */
  private applyContactData(contact: ContactInterface): void {
    this.contactColor.set(contact.color || '#cccccc');
    this.userform.patchValue({
      name: contact.name,
      email: contact.email,
      phone: (contact.phone ?? '').replace(/\s+/g, ''),
    });
  }

  /**
   * Liefert die Initialen des aktuell eingegebenen Namens.
   * @returns die Initialen oder ein leerer String
   */
  getInitials(): string {
    return initialsOf(this.name?.value ?? '');
  }

  /**
   * Liest die Formularwerte. Die Farbe bleibt unverändert.
   * @returns die bereinigten Kontaktdaten
   */
  private getFormData(): ContactData {
    return {
      name: capitalizeFirstLetter(this.userform.value.name?.trim() || ''),
      email: this.userform.value.email?.toLowerCase().trim() || '',
      phone: this.userform.value.phone?.replace(/\s+/g, '') || '',
    };
  }

  private resetAndCloseForm(): void {
    this.userform.reset();
    this.formSubmitted.set(false);
    this.isSubmitting.set(false);
    this.close();
  }

  /**
   * Zeigt je nach Fehler den Hinweis an der E-Mail oder eine allgemeine Meldung.
   * @param error der abgefangene Fehler
   */
  private handleError(error: unknown): void {
    if (isDuplicateEmail(error)) this.emailExistingError.set(true);
    else this.submitError.set('Contact could not be saved. Please try again.');
    this.isSubmitting.set(false);
  }

  private async saveContact(): Promise<void> {
    try {
      await this.contactService.updateContact(this.contactId(), this.getFormData());
      this.resetAndCloseForm();
    } catch (error) {
      this.handleError(error);
    }
  }

  async onSubmit(): Promise<void> {
    this.formSubmitted.set(true);
    this.emailExistingError.set(false);
    this.submitError.set('');
    if (!this.userform.valid || this.isSubmitting()) return;
    if (this.contactService.isEmailTaken(this.getFormData().email, this.contactId())) {
      this.emailExistingError.set(true);
      return;
    }
    this.isSubmitting.set(true);
    await this.saveContact();
  }
}