import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuestionSetModel } from '../../../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionSetStateService {
  private questionSetsUpdateSubject = new BehaviorSubject<boolean>(false);
  private questionSetsSubject = new BehaviorSubject<QuestionSetModel[]>([]);

  public updateSuccess$ = this.questionSetsUpdateSubject.asObservable();
  public questionSets$ = this.questionSetsSubject.asObservable();

  public setUpdateSuccess(value: boolean): void {
    this.questionSetsUpdateSubject.next(value);
  }
  public setQuestionSets(data: QuestionSetModel[]): void {
    this.questionSetsSubject.next(data);
  }
}
