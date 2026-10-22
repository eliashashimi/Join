import { Component, inject, output } from '@angular/core';
import { ContactService } from '../../service/contact-service';

@Component({
  selector: 'app-delete-confirm',
  templateUrl: './delete-confirm.html',
  styleUrl: './delete-confirm.scss',
})
export class DeleteConfirm {
  srv = inject(ContactService);
  confirmed = output<void>();

  cancel(): void {
    this.srv.showDeleteModal.set(false);
  }

  confirm(): void {
    this.confirmed.emit();
  }
}