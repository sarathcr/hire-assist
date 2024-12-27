import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssessmentWarningService {
  private warningCount = signal(1);

  public setWarningCount(count: number) {
    this.warningCount.update(curr => curr + count);
  }

  public getWarningCount() {
    return this.warningCount();
  }
}
