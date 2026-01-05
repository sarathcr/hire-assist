import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { CustomErrorResponse } from '../../../../../../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  Metadata,
} from '../../../../../../../../../shared/utilities/form.utility';
import {
  QuestionSetForm,
  QuestionSetFormInterface,
  QuestionSetFormModal,
} from '../../../../../../../models/assessment-schedule.model';
import { AssessmentService } from '../../../../../../../services/assessment.service';
import { QuestionSetStateService } from '../../../../../services/question-set-state.service';

@Component({
  selector: 'app-question-set-modal',
  imports: [
    CommonModule,
    InputTextComponent,
    ButtonComponent,
    ReactiveFormsModule,
    InputTextareaComponent,
  ],
  templateUrl: './question-set-modal.component.html',
  styleUrl: './question-set-modal.component.scss',
})
export class QuestionSetModalComponent implements OnInit, OnDestroy {
  public data!: QuestionSetForm;
  public metadata!: Metadata[];
  public isEdit = false;
  public questionSetFGroup!: FormGroup;
  public configMap!: ConfigMap;
  public questionSetModal = new QuestionSetFormModal();
  public isLoading = false;
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private storeService: StoreService,
    private messageService: MessageService,
    public dialog: DialogService,
    private assessmentService: AssessmentService,
    private questionSetStateService: QuestionSetStateService,
  ) {
    this.questionSetFGroup = buildFormGroup(this.questionSetModal);
  }

  ngOnInit(): void {
    this.setConfigMaps();
    this.data = this.config.data;
    this.storeService.setIsLoading(false);
    this.checkAndPatchQuestionSetDataInFGroup();
  }

  ngOnDestroy(): void {
    this.questionSetFGroup.reset();
  }

  public onSubmit() {
    this.questionSetFGroup.markAllAsTouched();

    if (this.isEdit) {
      this.updateQuestionSet(this.questionSetFGroup.value);
    } else {
      this.CreateQuestionSet(this.questionSetFGroup.value);
    }
  }

  public onClose() {
    this.ref.close({ isCreateSuccess: false });
  }
  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new QuestionSetFormModal();
    this.configMap = metadata.configMap || {};
  }

  private CreateQuestionSet(payload: QuestionSetFormInterface) {
    this.isLoading = true;
    payload.assessmentId = Number(this.data.assessmentId);
    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Created Question Set Successfully',
      });
      this.questionSetStateService.setUpdateSuccess(true);
      this.ref.close({ isCreateSuccess: true });
    };
    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
    };
    this.assessmentService
      .createEntity(payload, 'QuestionSet')
      .subscribe({ next, error });
  }

  private updateQuestionSet(payload: QuestionSetFormInterface) {
    this.isLoading = true;
    payload.assessmentId = Number(this.data.formData.assessmentId);
    payload.id = this.data.formData.id;
    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated Question Set Successfully',
      });
      this.questionSetStateService.setUpdateSuccess(true);
      this.ref.close();
    };

    const error = (err: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error.type,
      });
    };

    this.assessmentService
      .updateEntity('', payload, 'QuestionSet')
      .subscribe({ next, error });
  }

  private checkAndPatchQuestionSetDataInFGroup(): void {
    if (this.data?.formData?.id) {
      this.isEdit = true;
      this.questionSetFGroup.patchValue({
        title: this.data.formData.title,
        description: this.data.formData.description,
      });
    }
  }
}
