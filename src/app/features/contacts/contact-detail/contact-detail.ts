import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ContactInterface } from '../../../interface/contact-interface';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  templateUrl: './contact-detail.html',
  styleUrls: ['./contact-detail.scss'],
})
export class ContactDetailComponent {
  @Input() contact: ContactInterface | null = null;
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();


  /** Meldet der Kontaktliste, dass der Kontakt bearbeitet werden soll. */
  onEdit(): void {
    this.editClicked.emit();
  }


  /** Meldet der Kontaktliste, dass der Kontakt gelöscht werden soll. */
  onDelete(): void {
    this.deleteClicked.emit();
  }
}
