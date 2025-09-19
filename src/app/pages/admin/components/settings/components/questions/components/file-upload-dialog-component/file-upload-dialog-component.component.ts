import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
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

@Component({
  selector: 'app-file-upload-dialog-component',
  imports: [FileUploadModule, ButtonComponent, InputSelectComponent],
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
          this.fb.control('', Validators.required),
        );
      }

      if (!this.fGroup.contains('file')) {
        this.fGroup.addControl(
          'file',
          this.fb.control(null, Validators.required),
        );
      }

      this.configMap = this.data.configMap;
    }
  }
  public onFileChange(event: FileSelectEvent): void {
    const file = event.currentFiles;

    if (file.length) {
      this.fGroup.patchValue({
        optionAttachmentType: this.fGroup.value[this.attachmentTypeFieldKey],
        file: file[0],
      });
      this.fGroup.updateValueAndValidity();
      this.uploadedFileName = file[0].name;
    }
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();

    if (this.fGroup.invalid) {
      return;
    }
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
        this.ref.close(uploadedFile);
      },
      error: (err) => {
        console.error('File upload failed', err);
      },
    });
  }

  public onClose() {
    this.ref.close();
  }
}
