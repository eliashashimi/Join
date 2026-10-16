import { Component, ElementRef, inject, input, model, signal } from '@angular/core';

/**
 * Auswahl der Kategorie. `value` ist der Wert, der im Task gespeichert wird.
 * Falls dein Task-Interface andere Werte erwartet (z. B. 'technical' | 'user-story'),
 * ändere hier nur die `value`-Einträge.
 */
export const CATEGORIES = [
  { value: 'Technical Task', label: 'Technical Task' },
  { value: 'User Story', label: 'User Story' },
];

/**
 * Dropdown "Select task category" (Pflichtfeld).
 *
 * Verwendung im Formular:
 *   category = signal('');
 *   <app-category-select [(category)]="category" [invalid]="submitted() && !category()" />
 *
 * Das Menü schließt sich bei einem Klick neben das Dropdown.
 */
@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.html',
  styleUrl: './category-select.scss',
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class CategorySelect {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Gewählte Kategorie (Two-Way-Binding mit [(category)]), leer = keine Auswahl. */
  readonly category = model<string>('');
  /** `true` zeigt die Fehlermeldung "This field is required". */
  readonly invalid = input(false);
  readonly categories = CATEGORIES;
  readonly isOpen = signal(false);

  /** Text, der im Feld angezeigt wird. */
  get selectedLabel(): string {
    return this.categories.find((c) => c.value === this.category())?.label ?? '';
  }

  /** Öffnet oder schließt das Menü. */
  toggleOpen(): void {
    this.isOpen.update((open) => !open);
  }

  /** Übernimmt die Kategorie und schließt das Menü. */
  select(value: string): void {
    this.category.set(value);
    this.isOpen.set(false);
  }

  /** Schließt das Menü, wenn außerhalb der Komponente geklickt wird. */
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) this.isOpen.set(false);
  }
}