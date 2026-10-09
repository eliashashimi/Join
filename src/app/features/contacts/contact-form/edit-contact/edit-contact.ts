import { Component, inject, signal, input, output, effect } from '@angular/core';
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
import { Router, ActivatedRoute } from '@angular/router';
import { ContactData, ContactInterface } from '../../../../interface/contact-interface';
import { Supabase } from '../../../../service/supabase';
import { ContactService } from '../../../../service/contact-service';

const Name_Regex = '^[a-zA-ZäöüÄÖÜß]{2,}(?:[- ][a-zA-ZäöüÄÖÜß]{2,})*$';
const Email_Regex = '^[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\\.[a-z]{2,4}$';
const Phone_Regex = '^(?!^(\\d)\\1+$)(?!^\\s+$)[+0-9\\s/-]{3,20}$';

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
  route = inject(ActivatedRoute);
  supabase = inject(Supabase);
  contactService = inject(ContactService);
  formSubmitted = signal(false);
  contactColor: string = '#cccccc';
  existingContactId!: string;
  contactId = input.required<string>();
  closeModal = output<void>();

  constructor() {
    effect(() => {
      const id = this.contactId();
      if (id) {
        this.existingContactId = id;
        this.loadContactData(id);
      }
    });
  }

  close() {
    this.closeModal.emit();
  }

  userform = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(4), Validators.pattern(Name_Regex)]],
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

  async loadContactData(id: string) {
    // const data = await this.contactService.getContactById(id);
    const { data, error } = await this.supabase.client
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    console.log(data);

    if (error) {
      console.error('no contact loaded: ', error.message);
      return;
    }
    if (data) {
      this.contactColor = data.color || '#cccccc';
      this.userform.patchValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
    }
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
    this.formSubmitted.set(true);
    if (!this.userform.valid) {
      return;
    }
    try {
      const updateData = this.getFormData();
      await this.contactService.updateContact(this.existingContactId, updateData);
      this.resetAndCloseForm();
    } catch (error: any) {
      console.error('no contact loaded:', error.message);
    }
  }
}
