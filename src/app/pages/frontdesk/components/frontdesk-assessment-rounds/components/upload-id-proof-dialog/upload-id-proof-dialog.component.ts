import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { Dialog } from 'primeng/dialog';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { InputSelectComponent } from '../../../../../../shared/components/form/input-select/input-select.component';
import { AttachmentTypeEnum } from '../../../../../../shared/enums/status.enum';
import {
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../shared/utilities/form.utility';
import { AssessmentService } from '../../../../../admin/services/assessment.service';
import {
  FileDto,
  IdProofUploadRequest,
} from '../../../../../admin/models/assessment.model';
import { MessageService } from 'primeng/api';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';

export interface ExistingIdProofItem {
  fileDto: FileDto;
  blobId: string;
  attachmentTypeId: number;
  attachmentTypeName: string;
  fileName: string;
  isPdf: boolean;
  previewUrl?: string;
  isLoadingUrl?: boolean;
}

@Component({
  selector: 'app-upload-id-proof-dialog',
  imports: [
    CommonModule,
    FileUpload,
    ProgressSpinnerModule,
    ButtonModule,
    ToastModule,
    ButtonComponent,
    TabsModule,
    BadgeModule,
    Dialog,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './upload-id-proof-dialog.component.html',
  styleUrl: './upload-id-proof-dialog.component.scss',
  providers: [DialogService],
})
export class UploadIdProofDialogComponent implements OnInit, OnDestroy {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public uploadedFileName: string | undefined;
  public candidateId!: string;

  public readonly AADHAAR_TYPE = AttachmentTypeEnum.AadhaarCard.toString();
  public readonly PAN_TYPE = AttachmentTypeEnum.PanCard.toString();
  public activeTab: string = this.AADHAAR_TYPE;

  public existingProofs: ExistingIdProofItem[] = [];
  private _uploadedFileUrl: FileDto[] = [];

  public get uploadedFileUrl(): FileDto[] {
    return this._uploadedFileUrl;
  }
  public set uploadedFileUrl(files: FileDto[] | undefined) {
    this._uploadedFileUrl = files || [];
    this.syncExistingProofsFromDto(this._uploadedFileUrl);
  }

  public forceCancelRequest: string[] = [];
  public imageUrl: string[] = [];
  public blob!: Blob;
  public isLoading = false;
  public isLoadingExistingImages = true;
  public isUploading = false;
  public uploadProgress = 0;
  public hasUploadedSuccessfully = false;
  public displayViewer = false;
  public viewerTitle = '';
  public viewerUrl: string = '';
  public isViewerPdf = false;
  public previewImages: { file: File; previewUrl: string }[] = [];
  public readonly MAX_FILE_SIZE = 5242880;
  public readonly MAX_FILES = 10;
  public fileValidationError: string | null = null;
  private deleteRef?: DynamicDialogRef;
  private switchTabConfirmRef?: DynamicDialogRef;
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  public get aadhaarFiles(): ExistingIdProofItem[] {
    return this.existingProofs.filter(
      (f) => f.attachmentTypeId === AttachmentTypeEnum.AadhaarCard,
    );
  }

  public get panFiles(): ExistingIdProofItem[] {
    return this.existingProofs.filter(
      (f) => f.attachmentTypeId === AttachmentTypeEnum.PanCard,
    );
  }

  public get otherFiles(): ExistingIdProofItem[] {
    return this.existingProofs.filter(
      (f) =>
        f.attachmentTypeId !== AttachmentTypeEnum.AadhaarCard &&
        f.attachmentTypeId !== AttachmentTypeEnum.PanCard,
    );
  }

  public get existingFilesCount(): number {
    return this.existingProofs.length;
  }

  public get totalFilesCount(): number {
    return this.existingFilesCount + this.previewImages.length;
  }

  public get remainingFilesCount(): number {
    return Math.max(0, this.MAX_FILES - this.totalFilesCount);
  }

  public get isMaxFilesReached(): boolean {
    return this.totalFilesCount >= this.MAX_FILES;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly assessmentService: AssessmentService,
    private readonly messageService: MessageService,
    private readonly dialog: DialogService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  public idTypeSelectConfig: CustomSelectConfig = {
    id: 'idType',
    labelKey: 'ID Type',
    options: [
      {
        label: 'Aadhar Card',
        value: AttachmentTypeEnum.AadhaarCard.toString(),
      },
      { label: 'PAN Card', value: AttachmentTypeEnum.PanCard.toString() },
    ],
  };

  ngOnInit(): void {
    this.activeTab = this.AADHAAR_TYPE;
    this.fGroup = this.fb.group({
      idType: [this.activeTab, Validators.required],
      idFile: [null, this.validateFiles.bind(this)],
    });

    this.candidateId =
      this.config.data?.candidateId || this.config.data?.candidateEmail;

    this.loadExistingImages();
  }

  public onTabItemClick(event: MouseEvent, targetTab: string): void {
    if (this.activeTab === targetTab) return;

    if (this.previewImages.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.promptTabSwitchConfirmation(targetTab);
    }
  }

  public onTabChange(tabValue: string | number): void {
    const val = tabValue.toString();
    if (val === this.activeTab) return;

    if (this.previewImages.length > 0) {
      const previousTab = this.activeTab;
      this.promptTabSwitchConfirmation(val, previousTab);
      return;
    }

    this.switchTab(val);
  }

  public promptTabSwitchConfirmation(
    targetTab: string,
    previousTab?: string,
  ): void {
    const prev = previousTab || this.activeTab;

    const modalData: DialogData = {
      message:
        'You have un-uploaded files selected. Switching tabs without uploading will discard them. Are you sure you want to proceed?',
      isChoice: true,
      closeOnNavigation: true,
      acceptButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    };

    this.switchTabConfirmRef = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Unsaved Changes',
      width: '35vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.switchTabConfirmRef?.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.previewImages.forEach((img) =>
          URL.revokeObjectURL(img.previewUrl),
        );
        this.previewImages = [];
        this.switchTab(targetTab);
      } else {
        this.revertTab(prev);
      }
    });
  }

  public switchTab(tabValue: string): void {
    this.activeTab = tabValue;
    this.fGroup.patchValue({ idType: tabValue });
    this.updateFormValidation();
    this.fileValidationError = null;
    this.cdr.detectChanges();
  }

  private revertTab(previousTab: string): void {
    this.activeTab = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.activeTab = previousTab;
      this.fGroup.patchValue({ idType: previousTab });
      this.cdr.detectChanges();
    });
  }

  private syncExistingProofsFromDto(files: FileDto[]): void {
    this.existingProofs = (files || []).map((file) => {
      const { blobId, attachmentTypeId } = this.getFileDtoProperties(file);
      const fileName = this.getFileName(file);
      const isPdf = this.isPdf(file);
      const normTypeId =
        attachmentTypeId !== undefined
          ? Number(attachmentTypeId)
          : AttachmentTypeEnum.AadhaarCard;
      return {
        fileDto: file,
        blobId: blobId || '',
        attachmentTypeId: normTypeId,
        attachmentTypeName: this.getAttachmentTypeName(normTypeId),
        fileName,
        isPdf,
        previewUrl: undefined,
        isLoadingUrl: false,
      };
    });
  }

  public loadExistingImages(): void {
    if (!this.candidateId) {
      this.isLoadingExistingImages = false;
      return;
    }

    this.isLoadingExistingImages = true;
    this.assessmentService
      .getIdProofsByCandidateId(this.candidateId)
      .subscribe({
        next: (existingProof: FileDto[]) => {
          if (existingProof && existingProof.length > 0) {
            console.log('ID Proofs received from API:', existingProof);
            this.uploadedFileUrl = existingProof;
            if (this.totalFilesCount >= this.MAX_FILES) {
              this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
            }
            this.fetchImage();
          } else {
            this.uploadedFileUrl = [];
            this.isLoadingExistingImages = false;
          }
        },
        error: (error) => {
          console.error('Error fetching ID proofs:', error);
          this.uploadedFileUrl = [];
          this.isLoadingExistingImages = false;
        },
      });
  }

  private validateFiles() {
    if (this.previewImages.length === 0) {
      return { required: true };
    }
    if (this.totalFilesCount > this.MAX_FILES) {
      return { maxFiles: true };
    }
    return null;
  }

  public onFileChange(event: FileSelectEvent, uploader?: FileUpload): void {
    const files = event.currentFiles || event.files || [];
    this.fileValidationError = null;
    const targetUploader = uploader || this.fileUpload;

    if (this.isLoadingExistingImages) {
      targetUploader?.clear();
      return;
    }

    if (this.isMaxFilesReached) {
      this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
      targetUploader?.clear();
      return;
    }

    const remainingSlots = this.MAX_FILES - this.totalFilesCount;
    if (files.length > remainingSlots) {
      this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
      targetUploader?.clear();
      return;
    }

    Array.from(files).forEach((file: File) => {
      if (this.totalFilesCount >= this.MAX_FILES) {
        this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
        return;
      }

      if (
        file.type !== 'image/jpeg' &&
        file.type !== 'image/png' &&
        file.type !== 'application/pdf'
      ) {
        this.fileValidationError = `Only JPG, PNG and PDF files are accepted`;
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.fileValidationError = `${file.name}: Invalid file size, maximum upload size is ${this.MAX_FILE_SIZE / 1048576} MB.`;
        return;
      }

      const isDuplicate = this.previewImages.some(
        (img) =>
          img.file.name === file.name &&
          img.file.size === file.size &&
          img.file.lastModified === file.lastModified,
      );

      if (isDuplicate) {
        this.fileValidationError = `${file.name} already selected`;
        return;
      }

      const isExistingDuplicate =
        this.existingProofs?.some(
          (f) => f.fileName.toLowerCase() === file.name.toLowerCase(),
        ) ?? false;

      if (isExistingDuplicate) {
        this.fileValidationError = `${file.name} already uploaded`;
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      this.previewImages.push({ file, previewUrl });
    });

    targetUploader?.clear();
    this.updateFormValidation();
  }

  public removePreviewImage(index: number): void {
    URL.revokeObjectURL(this.previewImages[index].previewUrl);
    this.previewImages.splice(index, 1);

    if (this.totalFilesCount < this.MAX_FILES) {
      this.fileValidationError = null;
    }
    this.updateFormValidation();
  }

  private updateFormValidation() {
    if (this.previewImages.length > 0) {
      const filesArray = this.previewImages.map((img) => img.file);
      this.fGroup.patchValue({ idFile: filesArray });
    } else {
      this.fGroup.patchValue({ idFile: null });
    }
    this.fGroup.get('idFile')?.updateValueAndValidity();
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();
    if (
      this.fGroup.valid &&
      this.previewImages.length > 0 &&
      !this.isUploading &&
      this.totalFilesCount <= this.MAX_FILES
    ) {
      this.uploadFiles();
    }
  }

  private uploadFiles(): void {
    if (
      !this.candidateId ||
      this.previewImages.length === 0 ||
      this.totalFilesCount > this.MAX_FILES
    ) {
      if (this.totalFilesCount > this.MAX_FILES) {
        this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
      }
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    const filesToUpload = this.previewImages.map((img) => img.file);
    const totalFiles = filesToUpload.length;
    let uploadCount = 0;
    let hasError = false;

    filesToUpload.forEach((file) => {
      const payload: IdProofUploadRequest = {
        CandidateId: this.candidateId,
        IdType: +this.fGroup.value.idType,
        File: file,
        Description: '',
      };

      this.assessmentService.uploadIdProof(payload).subscribe({
        next: () => {
          uploadCount++;
          this.uploadProgress = Math.round((uploadCount / totalFiles) * 100);

          if (uploadCount === totalFiles && !hasError) {
            this.isUploading = false;
            this.hasUploadedSuccessfully = true;

            // Revoke and clear preview images
            this.previewImages.forEach((img) =>
              URL.revokeObjectURL(img.previewUrl),
            );
            this.previewImages = [];
            this.updateFormValidation();

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `${totalFiles} ID Proof file${totalFiles > 1 ? 's' : ''} uploaded successfully`,
            });

            // Reload existing images so the newly saved files show immediately in the modal
            this.loadExistingImages();
          }
        },
        error: (error: CustomErrorResponse) => {
          hasError = true;
          this.isUploading = false;
          this.uploadProgress = 0;
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: error?.error?.type || 'Failed to upload ID proof file',
          });
        },
      });
    });
  }

  public ngOnDestroy(): void {
    this.previewImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  }

  public onClose(): void {
    this.ref.close({ success: this.hasUploadedSuccessfully });
  }

  public onDeleteImage(index: number): void {
    const file = this.existingProofs[index];
    if (!file) return;
    this.onDeleteExistingProof(file);
  }

  public onDeleteExistingProof(item: ExistingIdProofItem): void {
    this.openDeleteConfirmDialog(item);
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private openDeleteConfirmDialog(item: ExistingIdProofItem): void {
    const modalData: DialogData = {
      message: `Are you sure you want to delete this file?`,
      isChoice: true,
      closeOnNavigation: true,
      acceptButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    };

    this.deleteRef = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      width: '35vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.deleteRef?.onClose.subscribe((res: boolean) => {
      if (res) {
        this.deleteProof(item);
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'Deletion Cancelled',
        });
      }
    });
  }

  private deleteProof(item: ExistingIdProofItem): void {
    const { blobId, attachmentTypeId } = item;

    if (!blobId || attachmentTypeId === undefined) {
      console.error(
        'Missing required properties in ExistingIdProofItem:',
        item,
      );
      return;
    }

    this.assessmentService
      .deleteIdProof({
        blobId,
        attachmentTypeId,
        candidateId: this.candidateId,
      })
      .subscribe({
        next: () => {
          this.existingProofs = this.existingProofs.filter((p) => p !== item);
          this._uploadedFileUrl = this.existingProofs.map((p) => p.fileDto);
          this.imageUrl = this.existingProofs
            .map((p) => p.previewUrl)
            .filter((url): url is string => !!url);

          this.updateFormValidation();
          if (this.totalFilesCount >= this.MAX_FILES) {
            this.fileValidationError = `Maximum ${this.MAX_FILES} files allowed`;
          } else {
            this.fileValidationError = null;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully',
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete file',
          });
        },
      });
  }

  private getFileDtoProperties(file: FileDto): {
    blobId: string | undefined;
    attachmentTypeId: number | undefined;
  } {
    let blobId: string | undefined = file.Id;
    let attachmentTypeId: number | undefined = file.AttachmentType;

    if (!blobId) {
      const fileWithLowercase = file as { id?: string; blobId?: string };
      blobId = fileWithLowercase.id || fileWithLowercase.blobId;
    }

    if (attachmentTypeId === undefined) {
      const fileWithLowercase = file as {
        attachmentType?: number;
        attachmentTypeId?: number;
        AttachmentTypeId?: number;
      };
      attachmentTypeId =
        fileWithLowercase.attachmentType ??
        fileWithLowercase.attachmentTypeId ??
        fileWithLowercase.AttachmentTypeId;
    }

    if (attachmentTypeId !== undefined) {
      attachmentTypeId = Number(attachmentTypeId);
    }

    return { blobId, attachmentTypeId };
  }

  public getFileName(file: any): string {
    return file?.Name || file?.name || 'Unknown File';
  }

  public getAttachmentType(file: any): number | undefined {
    const raw =
      file?.AttachmentType !== undefined
        ? file.AttachmentType
        : file?.attachmentType !== undefined
          ? file.attachmentType
          : file?.attachmentTypeId;
    return raw !== undefined ? Number(raw) : undefined;
  }

  public getAttachmentTypeName(type: number | string | undefined): string {
    if (type === undefined) return 'Unknown';
    const typeNum = Number(type);
    if (typeNum === AttachmentTypeEnum.AadhaarCard) return 'Aadhaar Card';
    if (typeNum === AttachmentTypeEnum.PanCard) return 'PAN Card';
    return 'Document';
  }

  public isPdf(file: any): boolean {
    const filename = this.getFileName(file) || '';
    return filename.toLowerCase().endsWith('.pdf');
  }

  public openViewer(file: ExistingIdProofItem): void {
    if (!file.previewUrl) return;
    this.viewerTitle = file.fileName;
    this.viewerUrl = file.previewUrl;
    this.isViewerPdf = file.isPdf;
    this.displayViewer = true;
  }

  public openPreviewViewer(preview: { file: File; previewUrl: string }): void {
    this.viewerTitle = preview.file.name;
    this.viewerUrl = preview.previewUrl;
    this.isViewerPdf =
      preview.file.type === 'application/pdf' ||
      preview.file.name.toLowerCase().endsWith('.pdf');
    this.displayViewer = true;
  }

  public closeViewer(): void {
    this.displayViewer = false;
    this.viewerUrl = '';
    this.viewerTitle = '';
    this.isViewerPdf = false;
  }

  public openImage(
    url: string | undefined,
    title = 'Document Viewer',
    isPdf = false,
  ): void {
    if (!url) return;
    this.viewerTitle = title;
    this.viewerUrl = url;
    this.isViewerPdf = isPdf;
    this.displayViewer = true;
  }

  public fetchImage(): void {
    if (!this.existingProofs || this.existingProofs.length === 0) {
      this.isLoadingExistingImages = false;
      return;
    }

    this.isLoadingExistingImages = true;
    let loadedCount = 0;
    const totalFiles = this.existingProofs.length;

    this.existingProofs.forEach((item: ExistingIdProofItem, idx: number) => {
      if (!item.blobId || item.attachmentTypeId === undefined) {
        loadedCount++;
        item.isLoadingUrl = false;
        if (loadedCount === totalFiles) {
          this.isLoadingExistingImages = false;
        }
        return;
      }

      item.isLoadingUrl = true;
      this.assessmentService
        .GetIdProofUrl({
          blobId: item.blobId,
          attachmentTypeId: item.attachmentTypeId,
          candidateId: this.candidateId,
        })
        .subscribe({
          next: (res) => {
            item.previewUrl = res.url;
            item.isLoadingUrl = false;
            this.imageUrl[idx] = res.url;
            this.imageUrl = [...this.imageUrl];
            loadedCount++;

            if (loadedCount === totalFiles) {
              this.isLoadingExistingImages = false;
            }
          },
          error: () => {
            item.isLoadingUrl = false;
            loadedCount++;
            if (loadedCount === totalFiles) {
              this.isLoadingExistingImages = false;
            }
          },
        });
    });
  }
}
