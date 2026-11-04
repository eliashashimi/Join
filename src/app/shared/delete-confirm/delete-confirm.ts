import { Component, inject, input, output } from '@angular/core';
import { ContactService } from '../../service/contact-service';

@Component({
  selector: 'app-delete-confirm',
  templateUrl: './delete-confirm.html',
  styleUrl: './delete-confirm.scss',
})
export class DeleteConfirm {
  srv = inject(ContactService);
  title = input('Delete contact');
  message = input('Are you sure you want to delete this contact?');
  confirmed = output<void>();

  cancel(): void {
    this.srv.showDeleteModal.set(false);
  }

  confirm(): void {
    this.confirmed.emit();
  }
}