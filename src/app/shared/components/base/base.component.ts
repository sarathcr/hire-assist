import { Component, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

@Component({
  template: '',
})
export class BaseComponent implements OnDestroy {
  protected subscriptionList: Subscription[] = [];

  ngOnDestroy(): void {
    if (this.subscriptionList && this.subscriptionList.length) {
      this.subscriptionList?.forEach((s) => s?.unsubscribe());
    }
  }
}
