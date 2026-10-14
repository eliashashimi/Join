import { Component, inject } from '@angular/core';
import { ContactService } from '../../service/contact-service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  contactService = inject(ContactService);
}