import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { UploadIdProofDialogComponent } from './upload-id-proof-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssessmentService } from '../../../../../admin/services/assessment.service';
import { FileDto } from '../../../../../admin/models/assessment.model';

describe('UploadIdProofDialogComponent', () => {
  let component: UploadIdProofDialogComponent;
  let fixture: ComponentFixture<UploadIdProofDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockDialogConfig: DynamicDialogConfig;
  let mockAssessmentService: jasmine.SpyObj<AssessmentService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  const createDummyFile = (name: string, size = 1024, type = 'image/png'): File => {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], name, { type, lastModified: Date.now() });
  };

  const createDummyFileDto = (id: string, name: string): FileDto => ({
    Id: id,
    Name: name,
    Path: `/uploads/${name}`,
    Url: `http://localhost/uploads/${name}`,
    AttachmentType: 1,
  });

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    mockDialogConfig = {
      data: {
        candidateId: 'cand-123',
        candidateEmail: 'candidate@test.com',
        candidateName: 'Test Candidate',
      },
    };
    mockAssessmentService = jasmine.createSpyObj('AssessmentService', [
      'getIdProofsByCandidateId',
      'GetIdProofUrl',
      'uploadIdProof',
      'deleteIdProof',
    ]);
    mockAssessmentService.getIdProofsByCandidateId.and.returnValue(of([]));
    mockAssessmentService.GetIdProofUrl.and.returnValue(of({ url: 'blob:http://localhost/test' }));
    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [UploadIdProofDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: DynamicDialogConfig, useValue: mockDialogConfig },
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadIdProofDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set fileValidationError and isMaxFilesReached when candidate already has 10 files', () => {
    const tenFiles: FileDto[] = Array.from({ length: 10 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    mockAssessmentService.getIdProofsByCandidateId.and.returnValue(of(tenFiles));

    component.ngOnInit();

    expect(component.existingFilesCount).toBe(10);
    expect(component.isMaxFilesReached).toBeTrue();
    expect(component.fileValidationError).toBe('Maximum 10 files allowed');
  });

  it('should reject file selection when max limit is already reached', () => {
    component.uploadedFileUrl = Array.from({ length: 10 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    const newFile = createDummyFile('new-file.png');

    component.onFileChange({
      originalEvent: new Event('change'),
      files: [newFile],
      currentFiles: [newFile],
    });

    expect(component.previewImages.length).toBe(0);
    expect(component.fileValidationError).toBe('Maximum 10 files allowed');
  });

  it('should reject batch of files when count exceeds remaining available slots', () => {
    component.uploadedFileUrl = Array.from({ length: 8 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    expect(component.remainingFilesCount).toBe(2);

    const filesToSelect = [
      createDummyFile('f1.png'),
      createDummyFile('f2.png'),
      createDummyFile('f3.png'),
    ];

    component.onFileChange({
      originalEvent: new Event('change'),
      files: filesToSelect,
      currentFiles: filesToSelect,
    });

    expect(component.previewImages.length).toBe(0);
    expect(component.fileValidationError).toBe('Maximum 10 files allowed');
  });

  it('should accept files when within remaining slots', () => {
    component.uploadedFileUrl = Array.from({ length: 8 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    expect(component.remainingFilesCount).toBe(2);

    const filesToSelect = [
      createDummyFile('f1.png'),
      createDummyFile('f2.png'),
    ];

    component.onFileChange({
      originalEvent: new Event('change'),
      files: filesToSelect,
      currentFiles: filesToSelect,
    });

    expect(component.previewImages.length).toBe(2);
    expect(component.totalFilesCount).toBe(10);
    expect(component.isMaxFilesReached).toBeTrue();
  });

  it('should reject selecting more than 10 files at once when 0 existing files', () => {
    component.uploadedFileUrl = [];
    const twelveFiles = Array.from({ length: 12 }, (_, i) =>
      createDummyFile(`doc-${i}.png`),
    );

    component.onFileChange({
      originalEvent: new Event('change'),
      files: twelveFiles,
      currentFiles: twelveFiles,
    });

    expect(component.previewImages.length).toBe(0);
    expect(component.fileValidationError).toBe('Maximum 10 files allowed');
  });

  it('should allow removing preview image and clear limit error when below max', () => {
    component.uploadedFileUrl = Array.from({ length: 9 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    const file = createDummyFile('single.png');
    component.onFileChange({
      originalEvent: new Event('change'),
      files: [file],
      currentFiles: [file],
    });

    expect(component.totalFilesCount).toBe(10);
    expect(component.isMaxFilesReached).toBeTrue();

    component.removePreviewImage(0);
    expect(component.totalFilesCount).toBe(9);
    expect(component.isMaxFilesReached).toBeFalse();
    expect(component.fileValidationError).toBeNull();
  });

  it('should invalidate form when totalFilesCount exceeds MAX_FILES', () => {
    component.uploadedFileUrl = Array.from({ length: 10 }, (_, i) =>
      createDummyFileDto(`id-${i}`, `file-${i}.png`),
    );
    component.previewImages = [{ file: createDummyFile('extra.png'), previewUrl: 'blob:test' }];

    const errors = component.fGroup.get('idFile')?.validator?.(component.fGroup.get('idFile')!);
    expect(errors?.['maxFiles']).toBeTrue();
  });
});
