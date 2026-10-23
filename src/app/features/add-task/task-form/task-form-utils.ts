import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Wandelt einen Text im Format dd/mm/yyyy in ein Datum um.
 * @param value der Text aus dem Datumsfeld
 * @returns das Datum oder null, wenn Format oder Datum ungültig sind
 */
export function parseDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal ? date : null;
}

/**
 * Wandelt ein Datum von dd/mm/yyyy nach yyyy-mm-dd für die Datenbank um.
 * @param value der Text aus dem Datumsfeld
 * @returns das Datum als yyyy-mm-dd oder ein leerer String bei ungültiger Eingabe
 */
export function toIsoDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Prüft, ob das Fälligkeitsdatum gültig ist und nicht in der Vergangenheit liegt.
 * @param control das Formularfeld mit dem Datum
 * @returns null bei gültigem oder leerem Wert, sonst der passende Fehler
 */
export function dueDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return { invalidDate: true };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today ? { pastDate: true } : null;
}

/**
 * Formatiert Eingaben beim Tippen zu dd/mm/yyyy.
 * @param raw der Wert aus dem Eingabefeld
 * @returns der formatierte Wert mit Schrägstrichen
 */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
  return parts.filter(Boolean).join('/');
}