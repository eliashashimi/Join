/** Vor- und Nachname: Buchstaben aller Sprachen, Bindestrich, Apostroph und Punkt erlaubt. */
export const NAME_REGEX = /^\p{L}[\p{L}'’.-]*(\s+\p{L}[\p{L}'’.-]*)+$/u;

/** E-Mail mit beliebig vielen Subdomains und TLDs ab 2 Buchstaben, Groß-/Kleinschreibung egal. */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** Telefonnummer: nur Ziffern, optional ein führendes Plus. */
export const PHONE_REGEX = /^\+?[0-9]{6,15}$/;

/** Avatar-Farben. Neue Kontakte bekommen zufällig eine davon. */
export const CONTACT_COLORS = [
  '#FF7A00',
  '#FF5EB3',
  '#6E52FF',
  '#9327FF',
  '#00BEE8',
  '#1FD7C1',
  '#FF745E',
  '#FFA35E',
  '#FC71FF',
  '#FFC701',
  '#0038FF',
  '#C3FF2B',
  '#FFE62B',
  '#FF4646',
  '#FFBB2B',
];

/**
 * Wählt zufällig eine der Avatar-Farben.
 * @returns eine Farbe als Hex-Wert
 */
export function randomColor(): string {
  return CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
}

/**
 * Berechnet die Initialen: erster Buchstabe des ersten und des letzten Wortes,
 * bei nur einem Wort die ersten zwei Buchstaben.
 * @param name vollständiger Name
 * @returns die Initialen in Großbuchstaben, bei leerem Namen ein leerer String
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Prüft, ob ein Datenbankfehler von einer doppelten E-Mail-Adresse kommt.
 * @param error der abgefangene Fehler
 * @returns true, wenn die E-Mail schon vergeben ist
 */
export function isDuplicateEmail(error: unknown): boolean {
  const e = error as { message?: string; code?: string };
  return e?.code === '23505' || !!e?.message?.toLowerCase().includes('unique_email');
}