import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ContactInterface } from '../../../interface/contact-interface';
import { ContactService } from '../../../service/contact-service';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  templateUrl: './contact-detail.html',
  styleUrls: ['./contact-detail.scss'],
})
export class ContactDetailComponent {
  @Input() contact: ContactInterface | null = null;
  @Output() editClicked = new EventEmitter<void>();

  private srv = inject(ContactService);

  /**
   * Sendet das Edit-Event ab.
   */
  onEdit(): void {
    this.editClicked.emit();
  }

  /**
   * Öffnet den Lösch-Dialog.
   */
  onDelete(): void {
    if (!this.contact?.id) return;
    this.srv.showDeleteModal.set(true);
  }
}