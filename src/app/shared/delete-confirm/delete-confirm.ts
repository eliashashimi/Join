import { Component, inject, output } from '@angular/core';
import { ContactService } from '../../service/contact-service';

/** Bestätigungsdialog zum Löschen eines Kontakts. */
@Component({
  selector: 'app-delete-confirm',
  templateUrl: './delete-confirm.html',
  styleUrl: './delete-confirm.scss',
})
export class DeleteConfirm {
  srv = inject(ContactService);
  confirmed = output<void>();

  /** Schließt den Dialog, ohne zu löschen. */
  cancel(): void {
    this.srv.showDeleteModal.set(false);
  }

  /** Meldet die Bestätigung an die Elternkomponente. */
  confirm(): void {
    this.confirmed.emit();
  }
}