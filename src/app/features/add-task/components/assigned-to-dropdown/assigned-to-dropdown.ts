import { Component, ElementRef, OnInit, computed, inject, model, signal } from '@angular/core';
import { ContactService } from '../../../../service/contact-service';

/** Maximale Anzahl Initialen-Kreise unter dem Feld, der Rest wird als "+N" angezeigt. */
const MAX_CHIPS = 5;

/**
 * Dropdown zum Zuweisen von Kontakten an einen Task (Mehrfachauswahl).
 *
 * Verwendung im Formular:
 *   assigneeIds = signal<string[]>([]);
 *   <app-assigned-to-dropdown [(selectedIds)]="assigneeIds" />
 *
 * Das Menü schließt sich bei einem Klick neben das Dropdown.
 */
@Component({
  selector: 'app-assigned-to-dropdown',
  templateUrl: './assigned-to-dropdown.html',
  styleUrl: './assigned-to-dropdown.scss',
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class AssignedToDropdown implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly contactService = inject(ContactService);

  /** IDs der ausgewählten Kontakte (Two-Way-Binding mit [(selectedIds)]). */
  readonly selectedIds = model<string[]>([]);
  readonly isOpen = signal(false);
  readonly searchText = signal('');
  readonly hasLoadError = signal(false);

  /** Kontakte, gefiltert nach dem Suchtext im Feld. */
  readonly filteredContacts = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const all = this.contactService.contacts();
    return query ? all.filter((c) => c.name.toLowerCase().includes(query)) : all;
  });

  /** Ausgewählte Kontakte für die Initialen-Kreise. */
  readonly selectedContacts = computed(() =>
    this.contactService.contacts().filter((c) => this.selectedIds().includes(c.id)),
  );
  readonly visibleChips = computed(() => this.selectedContacts().slice(0, MAX_CHIPS));
  readonly hiddenCount = computed(() => Math.max(0, this.selectedContacts().length - MAX_CHIPS));

  /** Lädt die Kontakte, falls sie noch nicht geladen sind. */
  async ngOnInit(): Promise<void> {
    if (this.contactService.contacts().length) return;
    try {
      await this.contactService.getContacts();
    } catch {
      this.hasLoadError.set(true);
    }
  }

  /** Öffnet das Menü. */
  open(): void {
    this.isOpen.set(true);
  }

  /** Schließt das Menü und setzt die Suche zurück. */
  close(): void {
    this.isOpen.set(false);
    this.searchText.set('');
  }

  /** Öffnet oder schließt das Menü (Pfeil-Button). */
  toggleOpen(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /** Schließt das Menü, wenn außerhalb der Komponente geklickt wird. */
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) this.close();
  }

  /** Übernimmt den Suchtext aus dem Eingabefeld. */
  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.open();
  }

  /** Wählt einen Kontakt aus oder ab. */
  toggleContact(id: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id],
    );
  }

  /** Ist der Kontakt aktuell ausgewählt? */
  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }
}