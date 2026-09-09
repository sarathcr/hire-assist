import { Component, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { isFormUnchanged } from '../../../../../../../../shared/utilities/form.utility';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { QuestionTypeFormGroup } from '../../../../../../models/question-type.model';

@Component({
  selector: 'app-question-type-dialog',
  imports: [
    InputTextComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './question-type-dialog.component.html',
  styleUrl: './question-type-dialog.component.scss',
})
export class QuestionTypeDialogComponent implements OnInit, OnDestroy {
  public data!: QuestionTypeFormGroup;
  public isEdit = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initialValue: any;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  public ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = Boolean(this.data?.formData?.id);
    if (this.isEdit && this.data?.formData) {
      this.data.fGroup.patchValue({ ...this.data.formData });
      this.initialValue = this.data.fGroup.value;
    }
  }

  public get isUnchanged(): boolean {
    if (!this.isEdit) return false;
    return isFormUnchanged(this.data.fGroup.value, this.initialValue);
  }

  public get questionCount(): number {
    return this.data?.formData?.questionCount ?? 0;
  }

  public get activeRecruitmentCount(): number {
    return this.data?.formData?.activeRecruitmentCount ?? 0;
  }

  public get isRenamedInActiveRecruitment(): boolean {
    return this.isEdit && this.activeRecruitmentCount > 0 && !this.isUnchanged;
  }

  public ngOnDestroy(): void {
    this.data?.fGroup?.reset();
  }

  public onSubmit(): void {
    this.data.fGroup.markAllAsTouched();
    if (!this.data.fGroup.valid) {
      return;
    }
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData?.id });
    } else {
      this.ref.close(this.data.fGroup.value);
    }
  }

  public onClose(): void {
    this.ref.close();
  }
}
