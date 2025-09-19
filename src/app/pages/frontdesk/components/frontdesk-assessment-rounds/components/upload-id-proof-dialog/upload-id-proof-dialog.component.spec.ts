import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadIdProofDialogComponent } from './upload-id-proof-dialog.component';

describe('UploadIdProofDialogComponent', () => {
  let component: UploadIdProofDialogComponent;
  let fixture: ComponentFixture<UploadIdProofDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadIdProofDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadIdProofDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
