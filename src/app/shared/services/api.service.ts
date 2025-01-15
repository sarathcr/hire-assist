import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export abstract class ApiService<T> {
  constructor(protected http: HttpClient) {}

  abstract getResourceUrl(): string;

  // BASIC CRUD METHODS

  /** GET (T entity) list request */
  public getEntityList(): Observable<T[]> {
    return this.http.get<T[]>(this.getResourceUrl()).pipe(
      tap(() => {
        // this.store.setIsLoading(false);
      })
    );
  }
}
