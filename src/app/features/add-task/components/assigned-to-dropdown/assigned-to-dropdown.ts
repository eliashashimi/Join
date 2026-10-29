import { Component, ElementRef, OnInit, computed, inject, model, signal } from '@angular/core';
import { ContactService } from '../../../../service/contact-service';

const MAX_CHIPS = 5;

@Component({
  selector: 'app-assigned-to-dropdown',
  templateUrl: './assigned-to-dropdown.html',
  styleUrl: './assigned-to-dropdown.scss',
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class AssignedToDropdown implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly contactService = inject(ContactService);

  readonly selectedIds = model<string[]>([]);
  readonly isOpen = signal(false);
  readonly searchText = signal('');
  readonly hasLoadError = signal(false);

  readonly filteredContacts = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const all = this.contactService.contacts();
    return query ? all.filter((c) => c.name.toLowerCase().includes(query)) : all;
  });

  readonly selectedContacts = computed(() =>
    this.contactService.contacts().filter((c) => this.selectedIds().includes(c.id)),
  );
  readonly visibleChips = computed(() => this.selectedContacts().slice(0, MAX_CHIPS));
  readonly hiddenCount = computed(() => Math.max(0, this.selectedContacts().length - MAX_CHIPS));

  /**
   * Lädt die Kontakte, falls sie noch fehlen, und merkt sich einen Ladefehler.
   */
  async ngOnInit(): Promise<void> {
    if (this.contactService.contacts().length) return;
    try {
      await this.contactService.getContacts();
    } catch {
      this.hasLoadError.set(true);
    }
  }

  /**
   * Öffnet die Kontaktliste.
   */
  open(): void {
    this.isOpen.set(true);
  }

  /**
   * Schließt die Kontaktliste und leert das Suchfeld.
   */
  close(): void {
    this.isOpen.set(false);
    this.searchText.set('');
  }

  /**
   * Öffnet die Kontaktliste oder schließt sie, wenn sie schon offen ist.
   */
  toggleOpen(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /**
   * Schließt die Liste bei einem Klick außerhalb der Komponente.
   * @param event das Klick-Event auf dem Dokument
   */
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) this.close();
  }

  /**
   * Übernimmt den Suchtext und öffnet die Liste.
   * @param event das Input-Event des Suchfelds
   */
  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.open();
  }

  /**
   * Wählt einen Kontakt aus oder wieder ab.
   * @param id die ID des Kontakts
   */
  toggleContact(id: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id],
    );
  }

  /**
   * Prüft, ob ein Kontakt ausgewählt ist.
   * @param id die ID des Kontakts
   * @returns true, wenn der Kontakt ausgewählt ist
   */
  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }
}