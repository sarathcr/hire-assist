import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssessmentWarningService {
  private readonly STORAGE_KEY = 'assessment_warning_count';
  private warningCount = signal(this.getInitialWarningCount());

  private getInitialWarningCount(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 1;
  }

  public setWarningCount(count: number) {
    this.warningCount.update((curr) => {
      const newCount = curr + count;
      localStorage.setItem(this.STORAGE_KEY, newCount.toString());
      return newCount;
    });
  }

  public getWarningCount() {
    return this.warningCount();
  }

  public reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.warningCount.set(1);
  }
}
