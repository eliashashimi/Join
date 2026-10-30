import { Routes } from '@angular/router';
import { MainLayout } from './shared/main-layout/main-layout';
import { Login } from './features/login/login';
import { Signup } from './features/signup/signup';
import { Summary } from './features/summary/summary';
import { Board } from './features/board/board';
import { AddTask } from './features/add-task/add-task';
import { ContactsComponent } from './features/contacts/contacts/contacts';
import { HelpPageComponent } from './features/help-page/help-page';
import { PrivacyPolicy } from './features/privacy-policy/privacy-policy';
import { LegalNotice } from './features/legal-notice/legal-notice';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  {
    path: '',
    component: MainLayout,
    // später: canActivate: [authGuard],
    children: [
      { path: 'summary', component: Summary },
      { path: 'board', component: Board },
      { path: 'add-task', component: AddTask },
      { path: 'contacts', component: ContactsComponent },
      { path: 'help', component: HelpPageComponent },
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'legal-notice', component: LegalNotice },
    ],
  },
  { path: '**', redirectTo: 'login' },
];