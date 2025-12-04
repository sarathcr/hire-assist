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

@Component({
  selector: 'app-file-upload-dialog-component',
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonComponent,
    InputSelectComponent,
    ProgressSpinnerModule,
    Button,
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
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public dialog: DialogService,
    private questionService: QuestionService,
  ) {}

  ngOnInit() {
    this.data = this.config.data;
    if (this.data) {
      this.fGroup = this.data.fGroup;
      if (this.data.configMap['attachmentType']) {
        this.attachmentTypeFieldKey = 'attachmentType';
      } else {
        this.attachmentTypeFieldKey = 'optionAttachmentType';
      }

      if (!this.fGroup.contains(this.attachmentTypeFieldKey)) {
        this.fGroup.addControl(
          this.attachmentTypeFieldKey,
          this.fb.control(null, Validators.required),
        );
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

  private handleFileUpload(file: File): void {
    this.fGroup.patchValue({
      optionAttachmentType: this.fGroup.value[this.attachmentTypeFieldKey],
      file: file,
    });
    this.fGroup.updateValueAndValidity();
    this.uploadedFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
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
        this.ref.close(uploadedFile);
      },
      error: (err) => {
        this.isUploading = false;
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
