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

  it('should initialize with activeTab as Aadhaar Card and idType form control patched', () => {
    expect(component.activeTab).toBe(component.AADHAAR_TYPE);
    expect(component.fGroup.get('idType')?.value).toBe(component.AADHAAR_TYPE);
  });

  it('should update activeTab and patch idType form control when onTabChange is called', () => {
    component.onTabChange(component.PAN_TYPE);

    expect(component.activeTab).toBe(component.PAN_TYPE);
    expect(component.fGroup.get('idType')?.value).toBe(component.PAN_TYPE);
  });

  it('should filter existing proofs into aadhaarFiles and panFiles correctly', () => {
    const mixedFiles: FileDto[] = [
      { Id: '1', Name: 'aadhaar1.png', Path: '/p1', Url: 'http://test/1', AttachmentType: 4 },
      { Id: '2', Name: 'aadhaar2.pdf', Path: '/p2', Url: 'http://test/2', AttachmentType: 4 },
      { Id: '3', Name: 'pan1.png', Path: '/p3', Url: 'http://test/3', AttachmentType: 5 },
    ];
    component.uploadedFileUrl = mixedFiles;

    expect(component.aadhaarFiles.length).toBe(2);
    expect(component.aadhaarFiles[0].fileName).toBe('aadhaar1.png');
    expect(component.aadhaarFiles[1].fileName).toBe('aadhaar2.pdf');
    expect(component.aadhaarFiles[1].isPdf).toBeTrue();

    expect(component.panFiles.length).toBe(1);
    expect(component.panFiles[0].fileName).toBe('pan1.png');
    expect(component.panFiles[0].isPdf).toBeFalse();
  });

  it('should clear pending previewImages and reset validation error when switching tabs without preview images', () => {
    component.previewImages = [];
    component.fileValidationError = 'Some error';

    component.onTabChange(component.PAN_TYPE);

    expect(component.activeTab).toBe(component.PAN_TYPE);
    expect(component.fileValidationError).toBeNull();
  });

  it('should prompt confirmation when switching tabs with pending preview images and cancel switch if user cancels', () => {
    component.activeTab = component.AADHAAR_TYPE;
    component.previewImages = [{ file: createDummyFile('test.png'), previewUrl: 'blob:test' }];

    const fakeConfirmRef = {
      onClose: of(false),
    } as any;
    spyOn((component as any).dialog, 'open').and.returnValue(fakeConfirmRef);

    component.onTabChange(component.PAN_TYPE);

    expect((component as any).dialog.open).toHaveBeenCalled();
    expect(component.previewImages.length).toBe(1);
  });

  it('should prompt confirmation when switching tabs with pending preview images and proceed if user confirms', () => {
    component.activeTab = component.AADHAAR_TYPE;
    component.previewImages = [{ file: createDummyFile('test.png'), previewUrl: 'blob:test' }];

    const fakeConfirmRef = {
      onClose: of(true),
    } as any;
    spyOn((component as any).dialog, 'open').and.returnValue(fakeConfirmRef);

    component.onTabChange(component.PAN_TYPE);

    expect((component as any).dialog.open).toHaveBeenCalled();
    expect(component.activeTab).toBe(component.PAN_TYPE);
    expect(component.previewImages.length).toBe(0);
  });

  it('should not close modal on upload completion, reload images, and pass success on onClose()', () => {
    component.candidateId = 'cand-123';
    component.activeTab = component.AADHAAR_TYPE;
    component.previewImages = [{ file: createDummyFile('test.png'), previewUrl: 'blob:test' }];
    component.fGroup.patchValue({ idType: component.AADHAAR_TYPE, idFile: [createDummyFile('test.png')] });

    mockAssessmentService.uploadIdProof.and.returnValue(of({} as any));
    spyOn(component, 'loadExistingImages');

    component.onSubmit();

    expect(mockAssessmentService.uploadIdProof).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.hasUploadedSuccessfully).toBeTrue();
    expect(component.previewImages.length).toBe(0);
    expect(component.loadExistingImages).toHaveBeenCalled();

    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
  });

  it('should open image viewer dialog when openViewer is called with an image file', () => {
    const file = {
      fileDto: createDummyFileDto('id-1', 'proof.png'),
      blobId: 'id-1',
      attachmentTypeId: 4,
      attachmentTypeName: 'Aadhaar Card',
      fileName: 'proof.png',
      isPdf: false,
      previewUrl: 'blob:http://localhost/proof.png',
    };

    component.openViewer(file);

    expect(component.displayViewer).toBeTrue();
    expect(component.viewerTitle).toBe('proof.png');
    expect(component.viewerUrl).toBe('blob:http://localhost/proof.png');
    expect(component.isViewerPdf).toBeFalse();
  });

  it('should open pdf viewer dialog when openViewer is called with a pdf file', () => {
    const file = {
      fileDto: createDummyFileDto('id-2', 'proof.pdf'),
      blobId: 'id-2',
      attachmentTypeId: 4,
      attachmentTypeName: 'Aadhaar Card',
      fileName: 'proof.pdf',
      isPdf: true,
      previewUrl: 'blob:http://localhost/proof.pdf',
    };

    component.openViewer(file);

    expect(component.displayViewer).toBeTrue();
    expect(component.viewerTitle).toBe('proof.pdf');
    expect(component.viewerUrl).toBe('blob:http://localhost/proof.pdf');
    expect(component.isViewerPdf).toBeTrue();
  });

  it('should open viewer for pending preview image and close cleanly', () => {
    const preview = {
      file: createDummyFile('preview.png'),
      previewUrl: 'blob:http://localhost/preview.png',
    };

    component.openPreviewViewer(preview);
    expect(component.displayViewer).toBeTrue();
    expect(component.viewerTitle).toBe('preview.png');
    expect(component.viewerUrl).toBe('blob:http://localhost/preview.png');

    component.closeViewer();
    expect(component.displayViewer).toBeFalse();
    expect(component.viewerUrl).toBe('');
    expect(component.viewerTitle).toBe('');
    expect(component.isViewerPdf).toBeFalse();
  });
});
