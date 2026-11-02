import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

interface CalendarDay {
  value: string;
  day: number;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const DATE_TEXT = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function toIsoValue(text: string): string {
  const match = DATE_TEXT.exec(text);
  if (!match) return '';
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '';
  }
  return `${yearText}-${monthText}-${dayText}`;
}

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

@Component({
  selector: 'app-date-picker-button',
  standalone: true,
  styleUrl: './date-picker-button.scss',
  templateUrl: './date-picker-button.html',
})
export class DatePickerButton {
  @Input() value = '';
  @Output() picked = new EventEmitter<string>();

  readonly weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  calendarOpen = false;
  calendarDays: (CalendarDay | null)[] = [];
  today = todayIso();
  visibleYear = new Date().getFullYear();
  visibleMonth = new Date().getMonth();
  monthLabel = '';

  open(): void {
    this.today = todayIso();
    const selected = toIsoValue(this.value) || this.today;
    const [year, month] = selected.split('-').map(Number);
    this.visibleYear = year;
    this.visibleMonth = month - 1;
    this.calendarOpen = true;
    this.updateCalendar();
  }

  close(): void {
    this.calendarOpen = false;
  }

  changeMonth(offset: number): void {
    const month = new Date(this.visibleYear, this.visibleMonth + offset, 1);
    this.visibleYear = month.getFullYear();
    this.visibleMonth = month.getMonth();
    this.updateCalendar();
  }

  selectDate(value: string): void {
    const [year, month, day] = value.split('-');
    this.picked.emit(`${day}/${month}/${year}`);
    this.close();
  }

  canGoToPreviousMonth(): boolean {
    return (
      this.visibleYear > Number(this.today.slice(0, 4)) ||
      (this.visibleYear === Number(this.today.slice(0, 4)) &&
        this.visibleMonth > Number(this.today.slice(5, 7)) - 1)
    );
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private updateCalendar(): void {
    const firstWeekday = (new Date(this.visibleYear, this.visibleMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(this.visibleYear, this.visibleMonth + 1, 0).getDate();
    const selected = toIsoValue(this.value);
    this.monthLabel = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(this.visibleYear, this.visibleMonth, 1));

    this.calendarDays = [
      ...Array<null>(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
        const day = index + 1;
        const value = `${this.visibleYear}-${String(this.visibleMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return {
          value,
          day,
          disabled: value < this.today,
          isToday: value === this.today,
          isSelected: value === selected,
        };
      }),
    ];
  }
}
