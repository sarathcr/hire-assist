import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PageLayout } from '../enum/enum';

@Injectable({
  providedIn: 'root',
})
export class PageLayoutService {
  private layoutSubject = new Subject<PageLayout>();

  public layout$ = this.layoutSubject.asObservable();

  public setLayout(value: PageLayout) {
    this.layoutSubject.next(value);
  }
}
