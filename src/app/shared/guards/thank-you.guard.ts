import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const thankYouGuard: CanDeactivateFn<unknown> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  const router = inject(Router);

  // Check if the user is navigating away from 'candidate/thank-you'
  if (
    currentState.url === '/candidate/thank-you' &&
    nextState?.url !== '/candidate'
  ) {
    // Redirect to candidate dashboard
    router.navigate(['/candidate']);
    return false; // Prevent navigation
  }

  return true; // Allow navigation if not leaving 'candidate/thank-you'
};
