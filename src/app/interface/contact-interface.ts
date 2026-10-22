export interface ContactInterface {
  id: string;

  name: string;

  email: string;

  phone: string;

  color: string;

  initials: string;

  createdAt: string;
  updatedAt: string;
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  color?: string;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface GroupedContacts {
    letter: string;
    contacts: ContactInterface[];
}