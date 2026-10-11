// =============================================================================
// Join – Supabase-Test
//
// Prüft die Verbindung und alle vier Aktionen (SELECT, INSERT, UPDATE, DELETE)
// Zusätzlich prüft er, ob ungültige Daten und Zugriffe ohne
// gültigen Key abgelehnt werden.
//
// Der Test legt einen Kontakt an, ändert ihn und löscht ihn wieder.
// Die vorhandenen Kontakte bleiben unverändert.
// =============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// URL und Key aus der environment.ts lesen
const environmentFile = new URL('../src/environments/environment.ts', import.meta.url);
const environmentText = readFileSync(environmentFile, 'utf8');
const readValue = (name) =>
  environmentText.match(new RegExp(`${name}:\\s*['"]([^'"]*)['"]`))?.[1] ?? '';

const supabaseUrl = readValue('supabaseUrl');
const supabasePublishableKey = readValue('supabasePublishableKey');
const TABLE = 'contacts';
// Alle Spalten aus supabase/contacts.sql – fehlt eine, schlägt die erste Prüfung fehl
const COLUMNS = 'id, name, email, phone, color, created_at, updated_at';
let passed = 0;
let failed = 0;
let testId = null;

/** Führt eine Prüfung aus und schreibt das Ergebnis in die Konsole. */
async function check(name, run) {
  try {
    const info = await run();
    passed++;
    console.log(`✓ ${name}${info ? ` – ${info}` : ''}`);
  } catch (error) {
    failed++;
    console.log(`✗ ${name}\n    ${error?.message ?? error}${hint(error ?? {})}`);
  }
}

/** Gibt zu den häufigsten Fehlern einen Tipp aus. */
function hint(error) {
  if (error.code === '42501')
    return '\n    Tipp: Rechte (GRANT) oder Policy fehlen – supabase/contacts.sql ausführen.';
  if (error.code === 'PGRST205')
    return '\n    Tipp: Die Tabelle gibt es noch nicht – supabase/contacts.sql ausführen.';
  if (error.code === '42703' || error.code === 'PGRST204')
    return '\n    Tipp: Die Spalten passen nicht zu supabase/contacts.sql – Tabelle neu aufbauen (siehe Kopf der Datei).';
  const message = String(error.message);
  if (/fetch failed|Failed to fetch/.test(message))
    return '\n    Tipp: supabaseUrl in environment.ts prüfen.';
  if (/API key/i.test(message))
    return '\n    Tipp: supabasePublishableKey in environment.ts prüfen.';
  return '';
}

/** Wirft einen Fehler, wenn die Bedingung nicht stimmt. */
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

if (!supabaseUrl || !supabasePublishableKey) {
  console.log(
    '✗ In src/environments/environment.ts fehlen supabaseUrl und/oder supabasePublishableKey.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const restUrl = `${supabaseUrl}/rest/v1/${TABLE}?select=id&limit=1`;

console.log(`Supabase-Test für ${supabaseUrl}\n`);

await check('Verbindung und SELECT', async () => {
  const { data } = await supabase.from(TABLE).select(COLUMNS).throwOnError();
  return `${data.length} Kontakte gelesen`;
});

await check('INSERT', async () => {
  const row = { name: 'Test Kontakt', email: 'test.kontakt@example.com' };
  const { data } = await supabase.from(TABLE).insert(row).select().single().throwOnError();
  testId = data.id;
  expect(data.color && data.created_at, 'Standardwerte (color, created_at) fehlen.');
  return 'Testkontakt angelegt, ID und Standardwerte kommen aus der Datenbank';
});

await check('UPDATE', async () => {
  expect(testId, 'Übersprungen, weil INSERT fehlgeschlagen ist.');
  const query = supabase.from(TABLE).update({ phone: '+49 0000 000000' }).eq('id', testId);
  const { data } = await query.select().single().throwOnError();
  expect(data.phone === '+49 0000 000000', 'Die Telefonnummer wurde nicht geändert.');
  expect(
    new Date(data.updated_at) > new Date(data.created_at),
    'updated_at wurde nicht neu gesetzt.',
  );
  return 'Telefon geändert, updated_at neu gesetzt';
});

await check('DELETE', async () => {
  expect(testId, 'Übersprungen, weil INSERT fehlgeschlagen ist.');
  await supabase.from(TABLE).delete().eq('id', testId).throwOnError();
  const { data } = await supabase
    .from(TABLE)
    .select('id')
    .eq('id', testId)
    .maybeSingle()
    .throwOnError();
  expect(data === null, 'Der Testkontakt ist noch da.');
  testId = null;
  return 'Testkontakt gelöscht';
});

await check('Ungültige Daten werden abgelehnt', async () => {
  const row = { name: 'Test Kontakt', email: 'keine-email' };
  const { data, error } = await supabase.from(TABLE).insert(row).select().maybeSingle();
  if (data) await supabase.from(TABLE).delete().eq('id', data.id);
  expect(!data, 'Ein Kontakt mit ungültiger E-Mail wurde gespeichert.');
  if (error?.code !== '23514') throw error ?? new Error('Unerwartete Antwort ohne Fehlermeldung.');
  return 'Kontakt mit ungültiger E-Mail wird nicht gespeichert';
});

await check('Zugriff ohne API-Key wird abgelehnt', async () => {
  const response = await fetch(restUrl);
  expect(!response.ok, `Die Anfrage kam ohne Key durch (Status ${response.status}).`);
  return `Status ${response.status}`;
});

await check('Zugriff mit falschem Key wird abgelehnt', async () => {
  const response = await fetch(restUrl, { headers: { apikey: 'sb_publishable_falsch' } });
  expect(!response.ok, `Die Anfrage kam mit falschem Key durch (Status ${response.status}).`);
  return `Status ${response.status}`;
});

// Aufräumen, falls der Test mittendrin abgebrochen ist
if (testId) await supabase.from(TABLE).delete().eq('id', testId);

console.log(
  failed
    ? `\n${failed} von ${passed + failed} Prüfungen fehlgeschlagen.`
    : `\nAlle ${passed} Prüfungen bestanden.`,
);
process.exit(failed ? 1 : 0);
