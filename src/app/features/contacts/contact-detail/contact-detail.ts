import { Component, Input, OnInit } from '@angular/core';
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
export class ContactDetailComponent implements OnInit {
  // 1. Normaler Kontakt (Zustand: "Kontakt ausgewählt")
  @Input() contact: Contact | null = {
    firstName: 'Anton',
    lastName: 'Mayer',
    email: 'anton@mayer.de',
    phone: '+49 1111 222233',
    color: '#FF7A00',
    initials: 'AM'
  };

  // Hilfs-Variablen zum Testen der States:
  isLoading: boolean = false;        // Für "Kontakt wird geladen"
  hasError: boolean = false;         // Für "Kontakt konnte nicht geladen werden"
  isDeleted: boolean = false;        // Für "Kontakt wurde gelöscht"

  // Dark-Mode Test-Variable
  isDarkMode: boolean = false;

  ngOnInit() {
    // Prüfen, ob beim letzten Mal der Dark Mode aktiv war
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  onEdit() {
    console.log('Edit clicked - nach Edit aktualisieren');
    if (this.contact) {
      this.contact.lastName = 'Mayer (Aktualisiert)';
    }
  }

  onDelete() {
    console.log('Delete clicked');
    this.isDeleted = true; // Simuliert "Kontakt wurde gelöscht"
  }
}