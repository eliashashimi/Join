/**
 * Ein Kontakt, so wie ihn die App verwendet (camelCase).
 */
export interface ContactInterface {
  id: string;

  /** Vor- und Nachname in einem Feld wie im Figma, z. B. 'Anton Mayer'. */
  name: string;

  email: string;

  /** Leerer String, wenn keine Telefonnummer hinterlegt ist. */
  phone: string;

  /** Avatar-Farbe als Hex-Wert. */
  color: string;

  /** Aus dem Namen berechnet, z. B. 'AM'. Steht nicht in der Datenbank. */
  initials: string;

  /** Zeitstempel, werden von der Datenbank gesetzt. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Die Felder, die das Formular beim Anlegen oder Bearbeiten liefert.
 * `phone` und `color` sind optional.
 */
export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  color?: string;
}

/**
 * Eine Zeile der Tabelle `contacts` in Supabase (Spaltennamen wie in der Datenbank).*/
export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}
