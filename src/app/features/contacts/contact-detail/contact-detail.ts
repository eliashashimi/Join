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
  @Output() editClicked = new EventEmitter<void>();

  private contactService = inject(ContactService);

  isLoading: boolean = false;
  hasError: boolean = false;
  isDeleted: boolean = false;
  showDeleteModal: boolean = false;

  /**
   * Sendet das Edit-Event ab.
   */
  onEdit(): void {
    this.editClicked.emit();
  }

  /**
   * Öffnet das Löschmodal.
   */
  onDelete(): void {
    if (!this.contact?.id) return;
    this.showDeleteModal = true;
  }

  /**
   * Schließt das Löschmodal.
   */
  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  /**
   * Bestätigt und führt den Löschprozess aus.
   */
  async confirmDelete(): Promise<void> {
    if (!this.contact?.id) return;
    this.prepDel();
    await this.delExec(this.contact.id);
  }

  /**
   * Bereitet das Löschen vor.
   */
  private prepDel(): void {
    this.showDeleteModal = false;
    this.isLoading = true;
    this.hasError = false;
  }

  /**
   * Führt den API-Löschvorgang aus.
   */
  private async delExec(id: string): Promise<void> {
    try {
      await this.contactService.deleteContact(id);
      this.handleDelSuccess();
    } catch (err) {
      this.handleDelError(err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Schließt die Detailansicht sofort und blendet die Meldung nach 3 Sekunden aus.
   */
  private handleDelSuccess(): void {
    this.contactDeleted.emit();
    this.contactService.showDeletedMessage.set(true);
    setTimeout(() => this.contactService.showDeletedMessage.set(false), 3000);
  }

  /**
   * Behandelt den Fehler beim Löschen.
   */
  private handleDelError(err: unknown): void {
    console.error('Error:', err);
    this.hasError = true;
  }
}