import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth-service';

/**
 * Lässt nur angemeldete Nutzer (auch Gäste) auf geschützte Seiten. Alle anderen kommen zum Login.
 * @returns `true` oder die Weiterleitung zum Login
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.isLoggedIn()) || router.createUrlTree(['/login']);
};


/**
 * Schickt angemeldete Nutzer von Log in und Sign up direkt zur Summary.
 * @returns `true` oder die Weiterleitung zur Summary
 */
export const loggedOutGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return !(await auth.isLoggedIn()) || router.createUrlTree(['/summary']);
};
