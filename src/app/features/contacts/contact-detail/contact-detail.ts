import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactInterface } from '../../../interface/contact-interface';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-detail.html',
  styleUrls: ['./contact-detail.scss']
})
export class ContactDetailComponent {
  @Input() contact: ContactInterface | null = null;

  isLoading: boolean = false;
  hasError: boolean = false;
  isDeleted: boolean = false;

  onEdit() {
    console.log('Edit clicked for:', this.contact?.name);

  }

  onDelete() {
    console.log('Delete clicked');
    this.isDeleted = true;
  }
}