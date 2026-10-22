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

  get selectedLabel(): string | undefined {
    const found = this.categories().find((c) => c.value === this.category());
    return found ? found.label : undefined;
  }

  toggleOpen(): void {
    this.isOpen.update((value) => !value);
  }

  select(value: string): void {
    this.category.set(value);
    this.isOpen.set(false);
  }

  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!event.composedPath().includes(this.host.nativeElement)) this.isOpen.set(false);
  }
}