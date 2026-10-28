import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

const DATE_TEXT = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Wandelt ein Datum von dd/mm/yyyy in yyyy-mm-dd um.
 * @param text Das Datum als dd/mm/yyyy.
 * @returns Das Datum als yyyy-mm-dd oder ein leerer Text, wenn es nicht passt.
 */
function toIsoValue(text: string): string {
  const match = DATE_TEXT.exec(text);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

/**
 * Liefert das heutige Datum in der Zeitzone des Nutzers.
 * @returns Heute als yyyy-mm-dd.
 */
function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Kalender-Button für das Datumsfeld. Öffnet den Datepicker des Browsers
 * und gibt das gewählte Datum als dd/mm/yyyy zurück.
 */
@Component({
  selector: 'app-date-picker-button',
  standalone: true,
  styleUrl: './date-picker-button.scss',
  templateUrl: './date-picker-button.html',
})
export class DatePickerButton {
  @Input() value = '';
  @Output() picked = new EventEmitter<string>();
  @ViewChild('dateInput', { static: true }) dateInput!: ElementRef<HTMLInputElement>;
  readonly minDate = todayIso();

  /**
   * Öffnet den Kalender und startet beim Datum, das gerade im Feld steht.
   * Fällt auf das heutige Datum zurück, falls das Eingabefeld noch unvollständig ist.
   */
  open(): void {
    const input = this.dateInput.nativeElement;
    const iso = toIsoValue(this.value);
    input.value = iso ? iso : todayIso();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  }

  /**
   * Gibt das im Kalender gewählte Datum als dd/mm/yyyy weiter.
   * @param event Das Änderungs-Ereignis des Datumsfeldes.
   */
  onPick(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    const [year, month, day] = value.split('-');
    this.picked.emit(`${day}/${month}/${year}`);
  }
}