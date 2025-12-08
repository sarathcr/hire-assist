import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import {
  ConfigMap,
  Metadata,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  FileDto,
  FileFormGroup,
  FileRequest,
} from '../../../../../../models/question.model';
import { QuestionService } from '../../../../../../services/question.service';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { AttachmentTypeEnum } from '../../../../../../../../shared/enums/status.enum';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-file-upload-dialog-component',
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonComponent,
    ProgressSpinnerModule,
    Button,
    Tooltip,
  ],
  templateUrl: './file-upload-dialog-component.component.html',
  styleUrl: './file-upload-dialog-component.component.scss',
})
export class FileUploadDialogComponentComponent implements OnInit {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public uploadedFileName: string | undefined;
  public data!: FileFormGroup;
  public metadata!: Metadata[];
  public isEdit = false;
  public attachmentTypeFieldKey!: 'attachmentType' | 'optionAttachmentType';
  public isUploading = false;
  public previewUrl: string | null = null;
  public fileControl: AbstractControl | null = null;
  public isQuestionAttachment = false;
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public dialog: DialogService,
    private questionService: QuestionService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.data = this.config.data;
    if (this.data) {
      this.fGroup = this.data.fGroup;
      if (this.data.configMap['attachmentType']) {
        this.attachmentTypeFieldKey = 'attachmentType';
        this.isQuestionAttachment = true;
        // Hardcode question image attachment type (7)
        if (!this.fGroup.contains(this.attachmentTypeFieldKey)) {
          this.fGroup.addControl(
            this.attachmentTypeFieldKey,
            this.fb.control(
              AttachmentTypeEnum.QuestionImage,
              Validators.required,
            ),
          );
        } else {
          this.fGroup.patchValue({
            [this.attachmentTypeFieldKey]: AttachmentTypeEnum.QuestionImage,
          });
        }
      } else {
        this.attachmentTypeFieldKey = 'optionAttachmentType';
        this.isQuestionAttachment = false;
        // Hardcode option image attachment type (8)
        if (!this.fGroup.contains(this.attachmentTypeFieldKey)) {
          this.fGroup.addControl(
            this.attachmentTypeFieldKey,
            this.fb.control(
              AttachmentTypeEnum.OptionImage,
              Validators.required,
            ),
          );
        } else {
          this.fGroup.patchValue({
            [this.attachmentTypeFieldKey]: AttachmentTypeEnum.OptionImage,
          });
        }
      }

      if (!this.fGroup.contains('file')) {
        this.fGroup.addControl(
          'file',
          this.fb.control(null, Validators.required),
        );
      }
      this.fileControl = this.fGroup.get('file');
      this.configMap = this.data.configMap;
    }
  }
  public onFileChange(event: FileSelectEvent): void {
    const file = event.currentFiles;

    if (file.length) {
      this.handleFileUpload(file[0]);
    } else {
      this.clearFileAndPreview();
    }
  }

  public onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileUpload(input.files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.add('drag-over');
    }
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('drag-over');
    }
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('drag-over');
    }

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.handleFileUpload(file);
      }
    }
  }

  public onDropzoneKeyDown(
    event: KeyboardEvent,
    fileInput: HTMLInputElement,
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  }

  private handleFileUpload(file: File): void {
    // Validate file size (5MB max)
    const maxSize = 5242880; // 5MB in bytes
    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Size Error',
        detail: 'File size exceeds 5MB limit. Please upload a smaller file.',
      });
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Type Error',
        detail: 'Only image files are allowed (JPG, PNG, GIF).',
      });
      return;
    }

    this.fGroup.patchValue({
      optionAttachmentType: this.fGroup.value[this.attachmentTypeFieldKey],
      file: file,
    });
    this.fGroup.updateValueAndValidity();
    this.uploadedFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();

    if (this.fGroup.invalid) {
      return;
    }
    this.isUploading = true;
    const attachmentType = Number(
      this.fGroup.value[this.attachmentTypeFieldKey],
    );
    const file = this.fGroup.value['file'];

    const payload: FileRequest = {
      attachmentType: attachmentType,
      file: file,
    };

    this.questionService.uploadFiles(payload).subscribe({
      next: (uploadedFile: FileDto) => {
        this.isUploading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'File uploaded successfully',
        });
        // Add a small delay to ensure toast is visible before closing modal
        setTimeout(() => {
          this.ref.close(uploadedFile);
        }, 500);
      },
      error: (err) => {
        this.isUploading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to upload file. Please try again.',
        });
        console.error('File upload failed', err);
      },
    });
  }

  public clearFileAndPreview(): void {
    if (this.fileControl) {
      this.fileControl.setValue(null);
      this.fileControl.markAsUntouched();
      this.fileControl.updateValueAndValidity();
    }

    this.previewUrl = null;
    this.uploadedFileName = undefined;
  }

  public onClose() {
    this.clearFileAndPreview();
    this.ref.close();
  }
}
