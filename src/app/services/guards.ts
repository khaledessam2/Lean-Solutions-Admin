import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from './supabase';

/** keeps the editors behind a session; the database enforces this too */
export const signedIn: CanActivateFn = () => {
  const supabase = inject(Supabase);
  return supabase.signedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/** sends an already-signed-in user past the login screen */
export const signedOut: CanActivateFn = () => {
  const supabase = inject(Supabase);
  return supabase.signedIn() ? inject(Router).createUrlTree(['/services']) : true;
};
