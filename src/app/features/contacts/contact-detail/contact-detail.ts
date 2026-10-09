import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactInterface } from '../../../interface/contact-interface';
import { ContactService } from '../../../service/contact-service';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-detail.html',
  styleUrls: ['./contact-detail.scss'],
})
export class ContactDetailComponent {
  @Input() contact: ContactInterface | null = null;
  @Output() contactDeleted = new EventEmitter<void>();
<<<<<<< HEAD
=======
  
>>>>>>> 8046db9d9bf62f0c4a888c3c9e8794ed3d1d00e0
  @Output() editClicked = new EventEmitter<void>();

  private contactService = inject(ContactService);

  isLoading: boolean = false;
  hasError: boolean = false;
  isDeleted: boolean = false;

  showDeleteModal: boolean = false;

  onEdit() {
    this.editClicked.emit();
  }

  onDelete() {
    if (!this.contact || !this.contact.id) return;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  async confirmDelete() {
    if (!this.contact || !this.contact.id) return;

    this.showDeleteModal = false;
    this.isLoading = true;
    this.hasError = false;

    try {
      await this.contactService.deleteContact(this.contact.id);
      this.isDeleted = true;

      setTimeout(() => {
        this.contactDeleted.emit();
      }, 1500);
    } catch (err) {
      console.error('Fehler beim Löschen des Kontakts:', err);
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  }
}