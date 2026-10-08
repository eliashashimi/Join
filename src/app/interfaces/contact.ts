export interface Contact {
    id: number;
    name: string;
    email: string;
    phone: string;
    initials: string;
    color: string;
}

export interface GroupedContacts {
    letter: string;
    contacts: Contact[];
}
