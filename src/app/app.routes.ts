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
import { authGuard, loggedOutGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [loggedOutGuard] },
  { path: 'signup', component: Signup, canActivate: [loggedOutGuard] },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'summary', component: Summary, canActivate: [authGuard] },
      { path: 'board', component: Board, canActivate: [authGuard] },
      { path: 'add-task', component: AddTask, canActivate: [authGuard] },
      { path: 'contacts', component: ContactsComponent, canActivate: [authGuard] },
      { path: 'help', component: HelpPageComponent, canActivate: [authGuard] },
      { path: 'privacy-policy', component: PrivacyPolicy },
      { path: 'legal-notice', component: LegalNotice },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
