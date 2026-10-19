import { Component, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [],
  templateUrl: './category-select.html',
  styleUrl: './category-select.scss',
})
export class CategorySelect {
  categories = input<{ value: string; label: string }[]>([]);

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
}