import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, tap } from 'rxjs';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root',
})
export abstract class ApiService<T> {
  constructor(
    protected http: HttpClient,
    private sanitize: DomSanitizer,
    protected store: StoreService
  ) {}

  abstract getResourceUrl(): string;

  // BASIC CRUD METHODS

  /** GET (T entity) list request */
  public getEntityList(): Observable<T[]> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(this.getResourceUrl())
    );
    if (sanitizedUrl) {
      return this.http.get<T[]>(sanitizedUrl).pipe(
        tap(() => {
          this.store.setIsLoading(false);
        })
      );
    } else {
      throw Error('invalid operation');
    }
  }

  /** GET (T entity) list request */
  public createEntity(payload: any): Observable<T[]> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(this.getResourceUrl())
    );
    if (sanitizedUrl) {
      return this.http.post<T[]>(sanitizedUrl, payload).pipe(
        tap(() => {
          this.store.setIsLoading(false);
        })
      );
    } else {
      throw Error('invalid operation');
    }
  }
}
