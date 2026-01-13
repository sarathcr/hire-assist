/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { debounceTime } from 'rxjs';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { isValidStartDate } from '../../../../../../../../shared/utilities/date.utility';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { Candidate } from '../../../../../../models/assessment-schedule.model';
import {
  CandidateApplicationQuestions,
  CandidateDataModel,
  CandidateModel,
} from '../../../../../../models/candidate-data.model';
@Component({
  selector: 'app-candidate-dialog',
  imports: [
    InputTextComponent,
    InputSelectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    InputTextCalenderComponent,
  ],
  templateUrl: './candidate-dialog.component.html',
  styleUrl: './candidate-dialog.component.scss',
})
export class CandidateDialogComponent implements OnInit {
  public candidateData: any;
  public fGroup!: FormGroup;
  public candidateDataModel = new CandidateDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;
  public batches!: Option[];
  public questionSets!: Option[];
  public applicationQuestions!: CandidateApplicationQuestions[];
  public today: Date = new Date();
  public hasDateError!: boolean;

  public startDateChanged = false;
  public endDateChanged = false;
  private originalDates: Record<string, Date> = {};
  public maxDate: Date = new Date();
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    const today = new Date();
    this.maxDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.candidateData = this.config.data;
    if (this.candidateData) {
      this.fGroup.patchValue(this.candidateData);
    }
    this.fGroup.updateValueAndValidity();
    this.setConfigMaps();
    this.setOptions();

    // this.fGroup
    //   .get('batch')
    //   ?.valueChanges.pipe(debounceTime(0))
    //   .subscribe(() => {
    //     const { startDate, endDate } = this.extractSharedDateTimes();

    //     if (startDate) {
    //       if (!this.originalDates['startDate']) {
    //         this.originalDates['startDate'] = new Date(startDate);
    //       }
    //       this.fGroup
    //         .get('startDate')
    //         ?.setValue(startDate, { emitEvent: false });
    //     } else {
    //       this.fGroup.get('startDate')?.reset({ emitEvent: false });
    //     }

    //     if (endDate) {
    //       if (!this.originalDates['endDate']) {
    //         this.originalDates['endDate'] = new Date(endDate);
    //       }
    //       this.fGroup.get('endDate')?.setValue(endDate, { emitEvent: false });
    //     } else {
    //       this.fGroup.get('endDate')?.reset({ emitEvent: false });
    //     }
    //   });

    // this.fGroup.get('startDate')?.valueChanges.subscribe((val) => {
    //   const original = this.originalDates['startDate'];
    //   this.startDateChanged = original
    //     ? new Date(original).getTime() !== new Date(val).getTime()
    //     : false;
    //   this.validateStartAndEndDates(this.fGroup, 'startDate', '');
    // });

    // this.fGroup.get('endDate')?.valueChanges.subscribe((val) => {
    //   const original = this.originalDates['endDate'];
    //   this.endDateChanged = original
    //     ? new Date(original).getTime() !== new Date(val).getTime()
    //     : false;
    //   this.validateStartAndEndDates(this.fGroup, '', 'endDate');
    // });
  }

  // Public Methods
  public onClose() {
    this.ref.close();
  }

  // public replaceNamesWithCodes(user: Candidate): Candidate {
  //   const updatedBatch = this.batches.find(
  //     (r) => r.label === user.batch,
  //   )?.value;

  //   const updatedQuestionSet = this.questionSets.find(
  //     (r) => r.label === user.questionSet,
  //   )?.value;

  //   return {
  //     ...user,
  //     batch: updatedBatch,
  //     questionSet: updatedQuestionSet,
  //   };
  // }
  // public isDateChanged(key: 'startDate' | 'endDate'): boolean {
  //   const original = this.originalDates[key];
  //   const current = this.fGroup.get(key)?.value;
  //   const result =
  //     original && current
  //       ? new Date(original).getTime() !== new Date(current).getTime()
  //       : false;
  //   if (result) {
  //     this.validateStartAndEndDates(this.fGroup, 'startDate', 'endDate');
  //   }
  //   return result;
  // }
  public onSubmit() {


    // const batchControl = this.fGroup.get('batch');
    // const questionSetControl = this.fGroup.get('questionSet');

    // Conditional validation: if batch is selected, questionSet must be selected
    // if (batchControl?.value && !questionSetControl?.value) {
    //   questionSetControl?.setErrors({ required: true });
    // }
    if (!this.fGroup.valid) {
      return;
    }

    const formValue = this.fGroup.value;
    const candidateFields = [
      'name',
      'email',
      'dob',
      'gender',
      'phone',
      'assessmentId',
    ];
    const candidatePayload: any = {};

    for (const key of candidateFields) {
      if (Object.prototype.hasOwnProperty.call(formValue, key)) {
        let value = formValue[key];
        if (key === 'dob' && value) {
          value = new Date(value).toISOString().split('T')[0];
        }

        candidatePayload[key === 'phone' ? 'phoneNumber' : key] = value;
      }
    }

    // Extract dynamic answers
    const answers = Object.entries(formValue)
      .filter(
        ([key, value]) =>
          !candidateFields.includes(key) && !isNaN(Number(key)) && value !== '',
      )
      .map(([key, value]) => ({
        questionId: Number(key),
        answer: value,
      }));

    candidatePayload.answers = answers;
    // candidatePayload.startDateTime = formValue['startDate'];
    // candidatePayload.endDateTime = formValue['endDate'];

    this.ref.close(candidatePayload);
  }

  // Private Methods

  // private validateStartAndEndDates(
  //   form: FormGroup,
  //   startDate?: string,
  //   endDate?: string,
  // ): void {
  //   const startDateControl = startDate ? form.get(startDate) : null;
  //   const endDateControl = endDate ? form.get(endDate) : null;

  //   const startValue = startDateControl?.value;
  //   const endValue = endDateControl?.value;

  //   startDateControl?.setErrors(null);
  //   endDateControl?.setErrors(null);

  //   let hasStartError = false;
  //   let hasEndError = false;

  //   if (startDateControl) {
  //     if (!startValue) {
  //       startDateControl.setErrors({ required: true });
  //       hasStartError = true;
  //     } else {
  //       const startDateTime = new Date(startValue);
  //       if (!isValidStartDate(startDateTime)) {
  //         startDateControl.setErrors({
  //           errorMessage: 'Start date must be today or later.',
  //         });
  //         hasStartError = true;
  //       }
  //     }
  //   }

  //   if (endDateControl) {
  //     if (!endValue) {
  //       endDateControl.setErrors({ required: true });
  //       hasEndError = true;
  //     }
  //   }

  //   if (
  //     startDateControl &&
  //     endDateControl &&
  //     !hasStartError &&
  //     !hasEndError &&
  //     startValue &&
  //     endValue
  //   ) {
  //     const startDateTime = new Date(startValue);
  //     const endDateTime = new Date(endValue);

  //     const endDateValidation = this.isValidEndDates(
  //       startDateTime,
  //       endDateTime,
  //     );
  //     if (!endDateValidation.valid) {
  //       const error = 'End date must follow start date.';
  //       endDateControl.setErrors({ errorMessage: error });
  //     }
  //   }
  // }

  private setConfigMaps(): void {
    const { metadata } = new CandidateDataModel();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    this.applicationQuestions = this.candidateData.applicationQuestions || [];
    this.applicationQuestions.forEach((q) => {
      this.fGroup.addControl(q.id.toString(), new FormControl(''));
    });
    // const batches = this.candidateData?.batches || [];
    // const questionSets = this.candidateData?.questionSets || [];
    // (this.configMap['batch'] as CustomSelectConfig).options = batches.map(
    //   (batch: any) => ({
    //     label: batch.title,
    //     value: batch.id.toString(),
    //   }),
    // );
    // let batches: any[] = [];
    // if (this.candidateData?.batches) {
    //   if (Array.isArray(this.candidateData.batches)) {
    //     batches = this.candidateData.batches;
    //   } else if (
    //     this.candidateData.batches.data &&
    //     Array.isArray(this.candidateData.batches.data)
    //   ) {
    //     // Handle PaginatedData object
    //     batches = this.candidateData.batches.data;
    //   }
    // }
    // (this.configMap['questionSet'] as CustomSelectConfig).options =
    //   questionSets.map((batch: any) => ({
    //     label: batch.title,
    //     value: batch.id.toString(),
    //   }));
    // let questionSets: any[] = [];
    // if (this.candidateData?.questionSets) {
    //   if (Array.isArray(this.candidateData.questionSets)) {
    //     questionSets = this.candidateData.questionSets;
    //   } else if (
    //     this.candidateData.questionSets.data &&
    //     Array.isArray(this.candidateData.questionSets.data)
    //   ) {
    //     // Handle PaginatedData object
    //     questionSets = this.candidateData.questionSets.data;
    //   }
  }
  //   this.batches = batches.map((batch: any) => ({
  //     label: batch.title,
  //     value: batch.id.toString(),
  //   }));
  //   (this.configMap['batch'] as CustomSelectConfig).options = this.batches;

  //   this.questionSets = questionSets.map((qs: any) => ({
  //     label: qs.title,
  //     value: qs.id.toString(),
  //   }));
  //   (this.configMap['questionSet'] as CustomSelectConfig).options =
  //     this.questionSets;
  // }

  // private extractSharedDateTimes(): { startDate?: Date; endDate?: Date } {
  //   const selectedBatchId = this.fGroup?.get('batch')?.value;
  //   if (!selectedBatchId) return {};
  //   const data: CandidateModel[] =
  //     this.candidateData?.candidateData?.data || [];

  //   const batchCandidates = data.filter(
  //     (c) => String(c.batchId) === String(selectedBatchId),
  //   );
  //   const validDates = batchCandidates?.filter(
  //     (c) =>
  //       c.startDateTime &&
  //       c.startDateTime !== '0001-01-01T00:00:00' &&
  //       c.endDateTime &&
  //       c.endDateTime !== '0001-01-01T00:00:00',
  //   );

  //   if (validDates.length === 0 && batchCandidates.length === 0) return {};

  //   const first = validDates[0];
  //   return {
  //     startDate: new Date(first.startDateTime!),
  //     endDate: new Date(first.endDateTime!),
  //   };
  // }

  // private isValidEndDates = (
  //   startDate: Date,
  //   endDate: Date,
  // ): { valid: boolean; error?: 'beforeStart' } => {
  //   if (endDate < startDate) {
  //     return { valid: false, error: 'beforeStart' };
  //   }

  //   return { valid: true };
  // };
}
