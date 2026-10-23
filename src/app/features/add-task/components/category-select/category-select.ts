import { Component, ElementRef, inject, input, model, signal } from '@angular/core';

const CATEGORIES = [
  { value: 'technical_task', label: 'Technical Task' },
  { value: 'user_story', label: 'User Story' },
];

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [],
  templateUrl: './category-select.html',
  styleUrl: './category-select.scss',
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class CategorySelect {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  categories = input<{ value: string; label: string }[]>(CATEGORIES);

  category = model<string>('');

  isOpen = signal<boolean>(false);
  invalid = input<boolean>(false);

  /**
   * Liefert die Bezeichnung der gewählten Kategorie.
   * @returns das Label oder undefined, wenn noch nichts gewählt ist
   */
  get selectedLabel(): string | undefined {
    const found = this.categories().find((c) => c.value === this.category());
    return found ? found.label : undefined;
  }

  /**
   * Öffnet das Auswahlmenü oder schließt es, wenn es schon offen ist.
   */
  toggleOpen(): void {
    this.isOpen.update((value) => !value);
  }

  /**
   * Wählt eine Kategorie und schließt das Menü.
   * @param value der Wert der gewählten Kategorie
   */
  select(value: string): void {
    this.category.set(value);
    this.isOpen.set(false);
  }

  /**
   * Schließt das Menü bei einem Klick außerhalb der Komponente.
   * @param event das Klick-Event auf dem Dokument
   */
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!event.composedPath().includes(this.host.nativeElement)) this.isOpen.set(false);
  }
}