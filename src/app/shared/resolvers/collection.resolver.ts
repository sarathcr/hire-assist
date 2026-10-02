import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { StoreService } from '../services/store.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { OptionsMap } from '../models/app-state.models';

export const collectionResolver: ResolveFn<OptionsMap> = () => {
  const storeService = inject(StoreService);
  const http = inject(HttpClient);
  const { collectionUrl } = environment;

  storeService.setIsLoading(true);
  const url = `${collectionUrl}/api/collection`;

  return http.get<OptionsMap>(url).pipe(
    map((collection) => {
      storeService.setCollection(collection);
      storeService.setIsLoading(false);
      return collection;
    }),
  );
};
