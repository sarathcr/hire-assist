import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-base',
  imports: [],
  templateUrl: './base.component.html',
  styleUrl: './base.component.scss',
})
export class BaseComponent implements OnDestroy {
  protected subscriptionList: Subscription[] = [];

  ngOnDestroy(): void {
    if (this.subscriptionList && this.subscriptionList.length) {
      this.subscriptionList?.forEach(s => s?.unsubscribe());
    }
  }
}
