import { Routes } from '@angular/router';
import { ContactsComponent } from './features/contacts/contacts/contacts';
import { HelpPageComponent } from './features/help-page/help-page';
import { PrivacyPolicy } from './features/privacy-policy/privacy-policy';
import { LegalNotice } from './features/legal-notice/legal-notice';
import { Board } from './features/board/board';
import { AddTask } from './features/add-task/add-task';

export const routes: Routes = [
    { path: '', redirectTo: 'contacts', pathMatch: 'full' },
    { path: 'contacts', component: ContactsComponent },
    { path: 'help', component: HelpPageComponent },
    { path: 'privacy-policy', component: PrivacyPolicy },
    { path: 'legal-notice', component: LegalNotice },
    { path: 'board', component: Board },
    { path: 'add-task', component: AddTask },
    // Platzhalter-Routen für Summary, Add Task und Board (behelfsweise auf Contacts gerichtet, bis die Komponenten existieren)
    { path: 'summary', redirectTo: 'contacts', pathMatch: 'full' },
    // { path: 'board', redirectTo: 'contacts', pathMatch: 'full' },
    // Wildcard-Route gegen weiße Seiten bei ungültigen URLs
    { path: '**', redirectTo: 'contacts' }
];