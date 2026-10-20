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

  async ngOnInit(): Promise<void> {
    if (this.contactService.contacts().length) return;
    try {
      await this.contactService.getContacts();
    } catch {
      this.hasLoadError.set(true);
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchText.set('');
  }

  toggleOpen(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) this.close();
  }

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.open();
  }

  toggleContact(id: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id],
    );
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }
}