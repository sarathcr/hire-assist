import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { StoreService } from './store.service';
import { PaginatedPayload } from '../models/pagination.models';

@Injectable({
  providedIn: 'root',
})
export abstract class ApiService<T> {
  constructor(
    protected http: HttpClient,
    private sanitize: DomSanitizer,
    protected store: StoreService,
  ) {}

  abstract getResourceUrl(): string;

  // BASIC CRUD METHODS

  /** GET (T entity) list request */
  public getEntityList(): Observable<T[]> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(this.getResourceUrl()),
    );

    if (sanitizedUrl) {
      return this.http.get<T[]>(sanitizedUrl).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          this.store.setIsLoading(false); // Stop loading on error
          return throwError(() => error);
        }),
      );
    } else {
      this.store.setIsLoading(false);
      throw Error('invalid operation');
    }
  }

  /** GET (T entity) by ID request */
  public getEntityById(id: number | string): Observable<T> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}/${id}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.get<T>(sanitizedUrl).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          this.store.setIsLoading(false); // Stop loading on error
          return throwError(() => error);
        }),
      );
    } else {
      this.store.setIsLoading(false);
      throw Error('invalid operation');
    }
  }

  /** CREATE (T entity) list request */
  public createEntity(payload: T, url?: string): Observable<T[]> {
    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}${url ? '/' + url : ''}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.post<T[]>(sanitizedUrl, payload).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          return throwError(() => error);
        }),
      );
    } else {
      throw Error('invalid operation');
    }
  }

  /** Update (T entity) list request */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public updateEntity(
    id?: string | number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any,
    url?: string,
  ): Observable<T[]> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}${id ? '/' + id : ''}${url ? '/' + url : ''}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.put<T[]>(sanitizedUrl, payload).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          this.store.setIsLoading(false); // Stop loading on error
          return throwError(() => error);
        }),
      );
    } else {
      this.store.setIsLoading(false);
      throw Error('invalid operation');
    }
  }

  /** DELETE (T entity) by ID request */
  public deleteEntityById(
    id: number | string,
    id2?: number | string,
  ): Observable<void> {
    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}/${id}${id2 ? '/' + id2 : ''}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.delete<void>(sanitizedUrl).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          return throwError(() => error);
        }),
      );
    } else {
      throw Error('invalid operation');
    }
  }
  /** Paginated (T entity) list request */
  public paginationEntity(
    url: string,
    payload: PaginatedPayload,
  ): Observable<T[]> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}/${url}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.post<T[]>(sanitizedUrl, payload).pipe(
        tap(() => this.store.setIsLoading(false)), // Stop loading on success
        catchError((error) => {
          this.store.setIsLoading(false); // Stop loading on error
          return throwError(() => error);
        }),
      );
    } else {
      this.store.setIsLoading(false);
      throw Error('invalid operation');
    }
  }

  /** Upload file request */
  public uploadFile(file: File, url?: string): Observable<T[]> {
    const formData = new FormData();
    formData.append('file', file);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}${url ? '/' + url : ''}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.post<T[]>(sanitizedUrl, formData).pipe(
        catchError((error) => {
          return throwError(() => error);
        }),
      );
    } else {
      throw Error('invalid operation');
    }
  }
}
