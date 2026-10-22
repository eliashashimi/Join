import { Component, inject, signal, output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactData } from '../../../../interface/contact-interface';
import { ContactService } from '../../../../service/contact-service';
import {
  EMAIL_REGEX,
  NAME_REGEX,
  PHONE_REGEX,
  getInitials as initialsOf,
  isDuplicateEmail,
  randomColor,
  capitalizeFirstLetter,
} from '../../../../shared/contact-utils';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-add-contact',
  styleUrl: './add-contact.scss',
  templateUrl: './add-contact.html',
})
export class AddContact {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  readonly color = randomColor();

  formSubmitted = signal(false);
  isSubmitting = signal(false);
  emailExistingError = signal<boolean>(false);
  submitError = signal('');
  closeModal = output<void>();
  contactCreated = output<string>();
  isClosing = signal(false);

  userform = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(NAME_REGEX)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REGEX)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_REGEX)]],
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

  close(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);

    setTimeout(() => {
      this.closeModal.emit();
      this.isClosing.set(false);
    }, 250);
  }

  /**
   * Liefert die Initialen des aktuell eingegebenen Namens.
   * @returns die Initialen oder ein leerer String
   */
  getInitials(): string {
    return initialsOf(this.name?.value ?? '');
  }

  /**
   * Liest die Formularwerte und ergänzt die gewählte Avatar-Farbe.
   * @returns die bereinigten Kontaktdaten
   */
  private getFormData(): ContactData {
    return {
      name: capitalizeFirstLetter(this.userform.value.name?.trim() || ''),
      email: this.userform.value.email?.toLowerCase().trim() || '',
      phone: this.userform.value.phone?.replace(/\s+/g, '') || '',
      color: this.color,
    };
  }

  private resetAndCloseForm(): void {
    this.userform.reset();
    this.formSubmitted.set(false);
    this.isSubmitting.set(false);
    this.close();
  }

  /**
   * Zeigt die Erfolgsmeldung und meldet den neuen Kontakt an die Liste.
   * @param contactId ID des neuen Kontakts
   */
  private handleSuccess(contactId: string): void {
    this.contactService.showSuccessMessage.set(true);
    this.resetAndCloseForm();
    this.contactCreated.emit(contactId);
    setTimeout(() => this.contactService.showSuccessMessage.set(false), 3000);
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

  private async createContact(): Promise<void> {
    try {
      const created = await this.contactService.addContact(this.getFormData());
      this.handleSuccess(created.id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async onSubmit(): Promise<void> {
    this.formSubmitted.set(true);
    this.emailExistingError.set(false);
    this.submitError.set('');
    if (!this.userform.valid || this.isSubmitting()) return;
    if (this.contactService.isEmailTaken(this.getFormData().email)) {
      this.emailExistingError.set(true);
      return;
    }
    this.isSubmitting.set(true);
    await this.createContact();
  }
}