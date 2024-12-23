import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssessmentWarningService {
  private warningCount = signal(0);

  public setWarningCount(count: number) {
    this.warningCount.set(count);
  }

  public getWarningCount() {
    return this.warningCount();
  }
}
