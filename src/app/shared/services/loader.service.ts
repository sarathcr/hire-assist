import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  public setLoading(state: boolean): void {
    this.loadingSubject.next(state);
  }

  public getLoading(): Observable<boolean> {
    return this.loading$;
  }
}
