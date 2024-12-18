/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { PageLayoutService } from '../services/page-layout.service';
import { inject } from '@angular/core';
import { PageLayout } from '../enum/enum';

export const setLayout = (inputLayout: PageLayout): ResolveFn<void> => {
  return (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
    inject(PageLayoutService).setLayout(inputLayout);
  };
};
