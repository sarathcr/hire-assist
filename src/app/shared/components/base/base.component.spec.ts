import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseComponent } from './base.component';
import { Subscription } from 'rxjs';

describe('BaseComponent', () => {
  let component: BaseComponent;
  let fixture: ComponentFixture<BaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should unsubscribe all subscriptions on destroy', () => {
    const sub1 = new Subscription();
    const sub2 = new Subscription();
    spyOn(sub1, 'unsubscribe');
    spyOn(sub2, 'unsubscribe');
    component['subscriptionList'] = [sub1, sub2];
    component.ngOnDestroy();
    expect(sub1.unsubscribe).toHaveBeenCalled();
    expect(sub2.unsubscribe).toHaveBeenCalled();
  });

  it('should not throw if subscription list is empty', () => {
    component['subscriptionList'] = [];
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should not throw if subscription list contains null values', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component['subscriptionList'] = [null as any, undefined as any];
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
