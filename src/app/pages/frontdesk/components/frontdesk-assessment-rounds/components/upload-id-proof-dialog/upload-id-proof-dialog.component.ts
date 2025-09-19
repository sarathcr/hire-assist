/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../shared/components/form/input-select/input-select.component';
import { ImageComponent } from '../../../../../../shared/components/image';
import { AttachmentTypeEnum } from '../../../../../../shared/enums/status.enum';
import {
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../shared/utilities/form.utility';
import { AssessmentService } from '../../../../../admin/services/assessment.service';
import { UploadIdProofSkeletonComponent } from './upload-id-proof-skeleton';

@Component({
  selector: 'app-upload-id-proof-dialog',
  imports: [
    InputSelectComponent,
    ButtonComponent,
    FileUpload,
    UploadIdProofSkeletonComponent,
    ImageComponent,
  ],
  templateUrl: './upload-id-proof-dialog.component.html',
  styleUrl: './upload-id-proof-dialog.component.scss',
})
export class UploadIdProofDialogComponent implements OnInit {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public uploadedFileName: string | undefined;
  public candidateId!: string;
  public uploadedFileUrl?: Blob[] | any;
  public forceCancelRequest: string[] = [];
  public imageUrl: string[] = [];
  public blob!: Blob;
  public isLoading = true;
  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly assessmentService: AssessmentService,
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
      idFile: [null, Validators.required],
    });
    this.uploadedFileUrl = this.config.data?.existingFileUrl;

    this.candidateId = this.config.data?.candidateEmail;
    if (this.uploadedFileUrl) {
      this.fetchImage();
    }
  }
  public onFileChange(event: FileSelectEvent): void {
    const file = event;
    if (file.files?.length) {
      this.fGroup.patchValue({ idFile: file.files[0] });
      this.uploadedFileName = file.files[0].name;
    }
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();
    if (this.fGroup.valid) {
      this.ref.close({
        ...this.fGroup.value,
        file: this.fGroup.value.idFile,
      });
    }
  }

  public onClose(): void {
    this.ref.close();
  }

  public onDeleteImage(index: number): void {
    const file = this.uploadedFileUrl[index];
    if (!file) {
      return;
    }

    this.assessmentService
      .deleteIdProof({
        blobId: file.id,
        attachmentTypeId: file.attachmentType,
        candidateId: this.candidateId,
      })
      .subscribe({
        next: () => {
          this.uploadedFileUrl.splice(index, 1);
          this.imageUrl.splice(index, 1);
          this.fGroup.patchValue({ idFile: null });
        },
      });
  }

  private fetchImage() {
    const files = Array.isArray(this.uploadedFileUrl)
      ? this.uploadedFileUrl
      : [this.uploadedFileUrl];
    files.forEach((file: any, idx: number) => {
      this.assessmentService
        .GetIdProofById({
          blobId: file.id,
          attachmentTypeId: file.attachmentType,
          candidateId: this.candidateId,
        })

        .subscribe({
          next: (blob: Blob) => {
            const url = URL.createObjectURL(blob);

            this.imageUrl[idx] = url;

            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
    });
  }
}
