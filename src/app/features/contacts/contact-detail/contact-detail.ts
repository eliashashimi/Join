import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  color: string;
  initials: string;
}

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-detail.html',
  styleUrls: ['./contact-detail.scss']
})
export class ContactDetailComponent {
  @Input() contact: Contact | null = {
    firstName: 'Anton',
    lastName: 'Mayer',
    email: 'anton@mayer.de',
    phone: '+49 1111 222233',
    color: '#FF7A00',
    initials: 'AM'
  };

  isLoading: boolean = false;
  hasError: boolean = false;
  isDeleted: boolean = false;

  onEdit() {
    console.log('Edit clicked');
    if (this.contact) {
      this.contact.lastName = 'Mayer (Aktualisiert)';
    }
  }

  onDelete() {
    console.log('Delete clicked');
    this.isDeleted = true;
  }
}