import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDuplicateRecordsComponent } from './manage-duplicate-records.component';
import { DialogService } from 'primeng/dynamicdialog';

describe('ManageDuplicateRecordsComponent', () => {
  let component: ManageDuplicateRecordsComponent;
  let fixture: ComponentFixture<ManageDuplicateRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageDuplicateRecordsComponent],
      providers: [DialogService],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageDuplicateRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
