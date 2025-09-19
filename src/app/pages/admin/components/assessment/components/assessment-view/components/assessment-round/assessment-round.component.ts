import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  AssessmentScheduleModal,
  RoundsInterface,
} from '../../../../../../models/assessment-schedule.model';
import { AssessmentRoundFormGroup } from '../../../../../../models/assessment.model';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { RoundModel } from '../../assessment-view.component';
import { AssessmentRoundSkeletonComponent } from './assessment-round-skeleton';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
@Component({
  selector: 'app-assessment-round',
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    DragDropModule,
    InputTextComponent,
    ReactiveFormsModule,
    AssessmentRoundSkeletonComponent,
    ToastModule,
    InputTextareaComponent,
  ],
  templateUrl: './assessment-round.component.html',
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundComponent implements OnInit {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public assessmentSchedule = new AssessmentScheduleModal();
  public optionsMap!: OptionsMap;
  public rounds!: Option[];
  public assessmentRounds!: RoundModel[];
  public submittedData!: AssessmentRoundFormGroup[];
  public isLoading = false;

  public assessmentId = input<number>();
  constructor(
    private storeService: StoreService,
    private messageService: MessageService,
    private assessmentScheduleService: AssessmentScheduleService,
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
  }
  ngOnInit(): void {
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();
    this.GetAssessmentRoundbyAssessment();
  }
  public onDrop(event: CdkDragDrop<AssessmentRoundFormGroup[]>) {
    moveItemInArray(
      this.submittedData,
      event.previousIndex,
      event.currentIndex,
    );
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();

    if (this.fGroup.value?.round?.length) {
      this.submittedData = this.rounds
        .filter((item: Option) =>
          this.fGroup.value.round.includes(item.value, item.label),
        )
        .map((item: Option) => ({
          id: item.value,
          name: item.label,
        }));
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Rounds are not selected',
      });
    }
  }
  public onReorderAssessmentRound(): void {
    this.isLoading = true;
    const payload = this.submittedData.map(
      (item: AssessmentRoundFormGroup, index: number) => ({
        RoundId: Number(item.id),
        name: item.name,
        sequence: index + 1,
      }),
    );

    this.assessmentScheduleService
      .CreateAssessmentRound(payload, Number(this.assessmentId()))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Rounds ordered successfully!',
          });
          this.isLoading = false;
        },
        error: (error: CustomErrorResponse) => {
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode == 3108) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                'You cannot delete or reorder this AssessmentRound Order because it refers to the other Interview or Assessment',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to save round order.',
            });
          }
          this.isLoading = false;
        },
      });
  }

  public onroundcreate() {
    if (this.fGroup.valid) {
      const formValue = this.fGroup.value;

      const payload: RoundsInterface = {
        id: formValue.id ?? 0,
        name: formValue.name,
        description: formValue.description ?? '',
      };

      this.CreateRound(payload);
    } else {
      this.fGroup.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please fill all required fields.',
      });
    }
  }

  //Private Methods
  private GetAssessmentRoundbyAssessment() {
    this.isLoading = true;
    this.assessmentScheduleService
      .GetAssessmentRound(Number(this.assessmentId()))
      .subscribe((response: RoundModel[]) => {
        this.isLoading = false;
        this.assessmentRounds = response;
        this.submittedData = response.map((item) => ({
          name: item.round,
          id: item.roundId.toString(),
          sequence: item.sequence,
        }));
        this.fGroup.patchValue({
          round: this.submittedData.map((item) => item.id),
        });
      });
  }
  private setConfigMaps(): void {
    const { metadata } = new AssessmentScheduleModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['round'] as CustomSelectConfig).options = this.optionsMap[
      'rounds'
    ] as unknown as Option[];
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.rounds = this.optionsMap['rounds'] as unknown as Option[];
  }
  private CreateRound(payload: RoundsInterface) {
    const next = () => {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Created rounds Successfully',
        });
      }, 200);
    };
    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Creation is failed',
      });
    };
    this.assessmentScheduleService.addRound(payload).subscribe({ next, error });
  }
}
