import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
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

@Component({
  selector: 'app-upload-id-proof-dialog',
  imports: [
    CommonModule,
    InputSelectComponent,
    FileUpload,
    ProgressSpinnerModule,
    ButtonModule,
    ToastModule,
  ],
  templateUrl: './upload-id-proof-dialog.component.html',
  styleUrl: './upload-id-proof-dialog.component.scss',
})
export class UploadIdProofDialogComponent implements OnInit, OnDestroy {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public uploadedFileName: string | undefined;
  public candidateId!: string;
  public uploadedFileUrl?: FileDto[];
  public forceCancelRequest: string[] = [];
  public imageUrl: string[] = [];
  public blob!: Blob;
  public isLoading = false;
  public isLoadingExistingImages = true;
  public isUploading = false;
  public uploadProgress = 0;
  public previewImages: { file: File; previewUrl: string }[] = [];
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  constructor(
    private readonly fb: FormBuilder,
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly assessmentService: AssessmentService,
    private readonly messageService: MessageService,
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
    this.fGroup = this.fb.group({
      idType: [null, Validators.required],
      idFile: [null, this.validateFiles.bind(this)],
    });

    this.candidateId = this.config.data?.candidateEmail;

    // Load existing images after modal opens
    this.loadExistingImages();
  }

  private loadExistingImages(): void {
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
            // Log the response structure for debugging
            console.log('ID Proofs received from API:', existingProof);
            this.uploadedFileUrl = existingProof;
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
    return null;
  }
  public onFileChange(event: FileSelectEvent): void {
    const files = event.currentFiles || event.files || [];
    if (files.length > 0) {
      // Handle multiple files and create previews
      Array.from(files).forEach((file: File) => {
        if (file.type.startsWith('image/')) {
          // Check if file is already added to avoid duplicates
          const isDuplicate = this.previewImages.some(
            (img) => img.file.name === file.name && img.file.size === file.size,
          );

          if (!isDuplicate) {
            const previewUrl = URL.createObjectURL(file);
            this.previewImages.push({
              file,
              previewUrl,
            });
          }
        }
      });

      // Update form with all files
      if (this.previewImages.length > 0) {
        const filesArray = this.previewImages.map((img) => img.file);
        this.fGroup.patchValue({ idFile: filesArray });
        this.fGroup.get('idFile')?.updateValueAndValidity();
        this.fGroup.get('idFile')?.markAsTouched();
      }
    }
  }

  public removePreviewImage(index: number): void {
    // Revoke object URL to free memory
    URL.revokeObjectURL(this.previewImages[index].previewUrl);
    this.previewImages.splice(index, 1);

    // Update form validation - require at least one file
    if (this.previewImages.length === 0) {
      this.fGroup.patchValue({ idFile: null });
      // Clear the file upload component
      if (this.fileUpload) {
        this.fileUpload.clear();
      }
    } else {
      const filesArray = this.previewImages.map((img) => img.file);
      this.fGroup.patchValue({ idFile: filesArray });
    }
    this.fGroup.get('idFile')?.updateValueAndValidity();
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();
    if (
      this.fGroup.valid &&
      this.previewImages.length > 0 &&
      !this.isUploading
    ) {
      this.uploadFiles();
    }
  }

  private uploadFiles(): void {
    if (!this.candidateId || this.previewImages.length === 0) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    const filesToUpload = this.previewImages.map((img) => img.file);
    const totalFiles = filesToUpload.length;
    let uploadCount = 0;
    let hasError = false;

    // Upload files sequentially
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
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `${totalFiles} ID Proof image${totalFiles > 1 ? 's' : ''} uploaded successfully`,
            });
            // Close modal after successful upload
            this.ref.close({ success: true });
          }
        },
        error: (error: CustomErrorResponse) => {
          hasError = true;
          this.isUploading = false;
          this.uploadProgress = 0;
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: error?.error?.type || 'Failed to upload ID proof image',
          });
        },
      });
    });
  }

  public ngOnDestroy(): void {
    // Clean up object URLs to prevent memory leaks
    this.previewImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  }

  public onClose(): void {
    this.ref.close();
  }

  public onDeleteImage(index: number): void {
    if (!this.uploadedFileUrl) {
      return;
    }
    const file = this.uploadedFileUrl[index];
    if (!file) {
      return;
    }

    // Handle both capitalized and lowercase property names from API
    const { blobId, attachmentTypeId } = this.getFileDtoProperties(file);

    if (!blobId || attachmentTypeId === undefined) {
      console.error('Missing required properties in FileDto:', file);
      return;
    }

    this.assessmentService
      .deleteIdProof({
        blobId: blobId,
        attachmentTypeId: attachmentTypeId,
        candidateId: this.candidateId,
      })
      .subscribe({
        next: () => {
          if (this.uploadedFileUrl) {
            this.uploadedFileUrl.splice(index, 1);
            this.imageUrl.splice(index, 1);
            this.fGroup.patchValue({ idFile: null });
          }
        },
      });
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private getFileDtoProperties(file: FileDto): {
    blobId: string | undefined;
    attachmentTypeId: number | undefined;
  } {
    // Handle both capitalized and lowercase property names from API
    // Check for capitalized properties first (as per FileDto interface)
    let blobId: string | undefined = file.Id;
    let attachmentTypeId: number | undefined = file.AttachmentType;

    // If capitalized properties are not available, try lowercase
    if (!blobId) {
      const fileWithLowercase = file as { id?: string; blobId?: string };
      blobId = fileWithLowercase.id || fileWithLowercase.blobId;
    }

    if (attachmentTypeId === undefined) {
      const fileWithLowercase = file as {
        attachmentType?: number;
        attachmentTypeId?: number;
      };
      attachmentTypeId =
        fileWithLowercase.attachmentType || fileWithLowercase.attachmentTypeId;
    }

    return { blobId, attachmentTypeId };
  }

  private fetchImage() {
    if (!this.uploadedFileUrl || this.uploadedFileUrl.length === 0) {
      this.isLoadingExistingImages = false;
      return;
    }

    this.isLoadingExistingImages = true;
    let loadedCount = 0;
    const totalFiles = this.uploadedFileUrl.length;

    this.uploadedFileUrl.forEach((file: FileDto, idx: number) => {
      // Handle both capitalized and lowercase property names from API
      const { blobId, attachmentTypeId } = this.getFileDtoProperties(file);

      if (!blobId || attachmentTypeId === undefined) {
        console.error('Missing required properties in FileDto:', file);
        loadedCount++;
        if (loadedCount === totalFiles) {
          this.isLoadingExistingImages = false;
        }
        return;
      }

      this.assessmentService
        .GetIdProofById({
          blobId: blobId,
          attachmentTypeId: attachmentTypeId,
          candidateId: this.candidateId,
        })
        .subscribe({
          next: (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            this.imageUrl[idx] = url;
            loadedCount++;

            if (loadedCount === totalFiles) {
              this.isLoadingExistingImages = false;
            }
          },
          error: () => {
            loadedCount++;
            if (loadedCount === totalFiles) {
              this.isLoadingExistingImages = false;
            }
          },
        });
    });
  }
}
