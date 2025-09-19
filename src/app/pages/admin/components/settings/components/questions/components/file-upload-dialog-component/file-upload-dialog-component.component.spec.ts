import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadDialogComponentComponent } from './file-upload-dialog-component.component';

describe('FileUploadDialogComponentComponent', () => {
  let component: FileUploadDialogComponentComponent;
  let fixture: ComponentFixture<FileUploadDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
