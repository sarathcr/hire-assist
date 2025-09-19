import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { PaginatedPayload } from '../models/pagination.models';
import { PaginatedData } from '../models/table.models';
import { StoreService } from './store.service';

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
  public paginationEntity<T>(
    url: string,
    payload: PaginatedPayload,
  ): Observable<PaginatedData<T>> {
    this.store.setIsLoading(true);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}/${url}`,
      ),
    );
    if (sanitizedUrl) {
      return this.http.post<PaginatedData<T>>(sanitizedUrl, payload).pipe(
        tap(() => this.store.setIsLoading(false)),
        catchError((error) => {
          this.store.setIsLoading(false);
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

  public uploadFileAndParseCsv(file: File, url?: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    const sanitizedUrl = this.sanitize.sanitize(
      4,
      this.sanitize.bypassSecurityTrustResourceUrl(
        `${this.getResourceUrl()}${url ? '/' + url : ''}`,
      ),
    );

    if (sanitizedUrl) {
      return this.http
        .post(sanitizedUrl, formData, {
          responseType: 'text', // get raw CSV string
        })
        .pipe(
          tap(() => this.store.setIsLoading(false)),
          catchError((error) => throwError(() => error)),
        );
    } else {
      throw Error('invalid operation');
    }
  }

  public getBlob(url: string): Observable<Blob> {
    return this.http.get(url, {
      responseType: 'blob',
    });
  }
  public downloadBlobInBrowser(
    url: string,
    fileName: string,
    cb?: () => void,
  ): void {
    this.store.setIsLoading(true);
    const next = (res: Blob) => {
      const blob = new Blob([res]);
      const blobURL = URL.createObjectURL(blob);
      const name = decodeURI(fileName);
      const a = document.createElement('a');
      a.href = blobURL;
      a.download = name;
      a.click();
      a.remove();
      URL.revokeObjectURL(blobURL);
      this.store.setIsLoading(false);
      if (cb) cb();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = (err: any) => {
      console.error('Error downloading blob in browser', err);
      this.store.setIsLoading(false);
    };
    this.getBlob(url).subscribe({ next, error });
  }
}
