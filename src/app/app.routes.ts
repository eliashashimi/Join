import { Routes } from '@angular/router';
import { ContactsComponent } from './features/contacts/contacts/contacts';
import { HelpPageComponent } from './features/help-page/help-page';
import { PrivacyPolicy } from './features/privacy-policy/privacy-policy';
import { LegalNotice } from './features/legal-notice/legal-notice';
import { Board } from './features/board/board';
import { AddTask } from './features/add-task/add-task';
import { Summary } from './features/summary/summary';

export const routes: Routes = [
  { path: '', redirectTo: 'summary', pathMatch: 'full' },
  { path: 'summary', component: Summary },
  { path: 'contacts', component: ContactsComponent },
  { path: 'help', component: HelpPageComponent },
  { path: 'privacy-policy', component: PrivacyPolicy },
  { path: 'legal-notice', component: LegalNotice },
  { path: 'board', component: Board },
  { path: 'add-task', component: AddTask },
  { path: '**', redirectTo: 'summary' },
];