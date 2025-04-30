import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { StoreService } from '../services/store.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export const collectionResolver: ResolveFn<[]> = () => {
  const storeService = inject(StoreService);
  const http = inject(HttpClient);
  const { collectionUrl } = environment;

  storeService.setIsLoading(true);
  const url = `${collectionUrl}/api/collection`;

  return http.get<[]>(url).pipe(
    map((collection) => {
      storeService.setCollection(collection);
      storeService.setIsLoading(false);
      return collection;
    }),
  );
};
