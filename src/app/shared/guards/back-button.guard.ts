import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const backButtonGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isBackBtnClicked =
    router.getCurrentNavigation()?.trigger === 'popstate';
  return !isBackBtnClicked;
};
