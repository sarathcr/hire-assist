import { Component, input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  AssessmentRoundData,
  CordinatorData,
} from '../../../../../../models/assessment-schedule.model';
import {
  CoordinatorDto,
  CoordinatorRoundItemDto,
} from '../../../../../../models/assessment.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { RoundModel } from '../../assessment-view.component';
import { CoordinatorSkeletonComponent } from './coordinator-step-skeleton.component';

interface RoundFormGroup {
  coordinator: FormControl<string[] | null>;
  assessmentRound: FormControl<string[] | null>;
}

export const coordinatorRequiredWhenRoundSelectedValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const round = control.get('assessmentRound');
  const coordinator = control.get('coordinator');

  if (!round || !coordinator) return null;

  const roundEmpty = !round.value || round.value.length === 0;
  const coordEmpty = !coordinator.value || coordinator.value.length === 0;

  if (roundEmpty) {
    round.setErrors({ ...(round.errors || {}), required: true });
  }

  if (!roundEmpty && coordEmpty) {
    coordinator.setErrors({ ...(coordinator.errors || {}), required: true });
  }

  return roundEmpty || coordEmpty ? { required: true } : null;
};

export const uniqueRoundValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (!(control instanceof FormArray)) {
    return null;
  }

  const rounds = control.controls.map(
    (c) => c.get('assessmentRound')?.value?.[0],
  );

  const filteredRounds = rounds.filter((r) => r != null);
  const uniqueRounds = new Set(filteredRounds);

  if (uniqueRounds.size < filteredRounds.length) {
    const counts = filteredRounds.reduce(
      (acc, val) => acc.set(val, (acc.get(val) || 0) + 1),
      new Map<number, number>(),
    );
    control.controls.forEach((c) => {
      const roundValue = c.get('assessmentRound')?.value?.[0];
      const formControl = c.get('assessmentRound');
      if (formControl && roundValue && (counts.get(roundValue) ?? 0) > 1) {
        formControl.setErrors({ ...formControl.errors, duplicate: true });
      }
    });
    return { duplicateRounds: true };
  }

  control.controls.forEach((c) => {
    const formControl = c.get('assessmentRound');
    if (formControl?.hasError('duplicate')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { duplicate, ...otherErrors } = formControl.errors ?? {};
      formControl.setErrors(
        Object.keys(otherErrors).length ? otherErrors : null,
      );
    }
  });

  return null;
};

@Component({
  selector: 'app-coordinator-step',
  imports: [
    ReactiveFormsModule,
    InputMultiselectComponent,
    ButtonComponent,
    ToastModule,
    CoordinatorSkeletonComponent,
  ],
  templateUrl: './coordinator-step.component.html',
  styleUrl: './coordinator-step.component.scss',
})
export class CoordinatorStepComponent implements OnInit, OnDestroy {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public cordinatorData!: CordinatorData;
  public isEdit = false;
  public coordinatorData!: CordinatorData;
  public assessmentRoundConfigs: CustomSelectConfig[] = [];

  private assessmentRounds!: RoundModel[];
  private cordinatorRoundData!: CoordinatorDto;
  private cordinators!: Option[];
  private optionsMap!: OptionsMap;
  private valueChangesSub?: Subscription;

  public assessmentId = input<number>();

  get assessmentRoundsDetailsFormArray(): FormArray<FormGroup<RoundFormGroup>> {
    return this.fGroup.get('assessmentRoundsDetails') as FormArray<
      FormGroup<RoundFormGroup>
    >;
  }

  constructor(
    private readonly fb: FormBuilder,
    public messageService: MessageService,
    private assessmentService: AssessmentService,
    private assessmentScheduleService: AssessmentScheduleService,
    private storeService: StoreService,
    private stepsStatusService: StepsStatusService,
  ) {}

  ngOnInit(): void {
    this.fGroup = this.fb.group({
      assessmentRoundsDetails: this.fb.array([], [uniqueRoundValidator]),
    });
    this.getCordinators();

    this.valueChangesSub =
      this.assessmentRoundsDetailsFormArray.valueChanges.subscribe(() => {
        this.updateAvailableOptions();
      });
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();
    if (this.fGroup.invalid) {
      if (this.assessmentRoundsDetailsFormArray.hasError('duplicateRounds')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Each assessment round can only be selected once.',
        });
      }
      return;
    }

    const rawData: AssessmentRoundData[] =
      this.fGroup.getRawValue().assessmentRoundsDetails;
    const filteredData = rawData.filter(
      (detail) =>
        detail.assessmentRound &&
        detail.assessmentRound.length > 0 &&
        detail.coordinator &&
        detail.coordinator.length > 0,
    );

    const apiPayload = filteredData.map((detail) => ({
      assessmentRoundId: Number(detail.assessmentRound[0]),
      coordinatorId: detail.coordinator || [],
    }));

    if (apiPayload.length == 0) {
      const next = () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Removed Successfully',
        });
        this.fGroup.markAsPristine();
        this.checkStepStatusAndMoveNext();
      };

      const error = (error: CustomErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error : ${error.error.type}`,
        });
      };
      this.assessmentService
        .Deletecoordinator(Number(this.assessmentId()))
        .subscribe({ next, error });
    } else {
      const payload = {
        assessmentId: this.assessmentId(),
        coordinatorRound: apiPayload,
      };
      const next = () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Round and coordinator assigned successfully',
        });
        this.fGroup.markAsPristine();
        this.checkStepStatusAndMoveNext();
      };

      const error = (err: string) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
        });
      };

      this.assessmentService
        .createEntity(payload, 'Coordinator')
        .subscribe({ next, error });
    }
  }

  public addRound(): void {
    this.assessmentRoundConfigs.push(this.createRoundConfig());
    this.assessmentRoundsDetailsFormArray.push(this.createRoundFormGroup());
    this.updateAvailableOptions();
  }

  public removeRound(index: number): void {
    this.assessmentRoundConfigs.splice(index, 1);
    this.assessmentRoundsDetailsFormArray.removeAt(index);
    this.updateAvailableOptions();
  }

  private GetAssessmentRoundbyAssessment() {
    this.assessmentScheduleService
      .GetAssessmentRound(Number(this.assessmentId()))
      .subscribe((response: RoundModel[]) => {
        this.assessmentRounds = response;
        this.getCordinatorRoundData();
      });
  }

  private onCoordinatorClick(): void {
    if (!this.assessmentRounds || this.assessmentRounds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Open',
        detail:
          'There are no recruitment rounds available to assign coordinators.',
      });

      return;
    }

    const assessmentRoundOptions: Option[] = this.assessmentRounds.map(
      (round: RoundModel) => ({
        label: round.round,
        value: round.id ? String(round.id) : '',
      }),
    );

    this.coordinatorData = {
      cordinators: this.cordinators || [],
      assessmentRounds: assessmentRoundOptions,
      assessmentId: Number(this.assessmentId()),
      cordinatorRoundData: this.cordinatorRoundData,
    };
    this.getCordinatorData();
  }

  private getCordinatorRoundData() {
    const next = (res: CoordinatorDto) => {
      this.cordinatorRoundData = res;
      this.onCoordinatorClick();
    };
    const error = () => {
      this.cordinatorRoundData = {
        assessmentId: Number(this.assessmentId()),
        coordinatorRound: [],
      };
    };
    this.assessmentService
      .Getcoordinator(Number(this.assessmentId()))
      .subscribe({ next, error });
  }

  private getCordinators() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    const coordinators =
      (this.optionsMap?.['coordinators'] as unknown as Option[]) || [];

    this.cordinators = coordinators.map((item: Option) => ({
      label: item.label,
      value: item.value,
    }));

    this.GetAssessmentRoundbyAssessment();
  }

  private getCordinatorData() {
    this.cordinatorData = this.coordinatorData;
    if (this.cordinatorData) {
      this.isEdit =
        !!this.cordinatorData.cordinatorRoundData?.coordinatorRound?.length;
      this.setConfigMaps();
      this.setOptions();
      this.initializeFormRounds();
    }
  }

  private setConfigMaps(): void {
    this.configMap = {
      coordinator: {
        id: 'coordinator',
        labelKey: 'Coordinator',
      } as CustomSelectConfig,
      assessmentRound: {
        id: 'assessmentRound',
        labelKey: 'Recruitment Rounds',
        options: this.cordinatorData.assessmentRounds,
      } as CustomSelectConfig,
    };
  }

  private setOptions(): void {
    (this.configMap['coordinator'] as CustomSelectConfig).options =
      (this.cordinatorData?.cordinators as unknown as Option[]) || [];
  }

  private initializeFormRounds(): void {
    this.assessmentRoundsDetailsFormArray.clear();
    this.assessmentRoundConfigs = [];

    if (this.isEdit) {
      const editData = this.cordinatorData.cordinatorRoundData.coordinatorRound;
      editData.forEach((item: CoordinatorRoundItemDto) => {
        this.assessmentRoundConfigs.push(this.createRoundConfig());
        this.assessmentRoundsDetailsFormArray.push(
          this.createRoundFormGroup(
            [String(item.assessmentRoundId)],
            item.coordinatorId,
          ),
        );
      });
    } else {
      this.addRound();
    }
    this.updateAvailableOptions();
    this.fGroup.markAsPristine();
  }

  private createRoundFormGroup(
    roundIds: string[] | null = null,
    coordinatorIds: string[] | null = null,
  ): FormGroup<RoundFormGroup> {
    return this.fb.group(
      {
        coordinator: new FormControl<string[] | null>(coordinatorIds),
        assessmentRound: new FormControl<string[] | null>(roundIds),
      },
      { validators: [coordinatorRequiredWhenRoundSelectedValidator] },
    );
  }

  private createRoundConfig(): CustomSelectConfig {
    // FIX: Cast to CustomSelectConfig to assure Typescript that 'options' exists
    return { ...(this.configMap['assessmentRound'] as CustomSelectConfig) };
  }

  private updateAvailableOptions(): void {
    const allSelectedValues = this.assessmentRoundsDetailsFormArray.controls
      .map((ctrl) => ctrl.get('assessmentRound')?.value?.[0])
      .filter((val) => val != null);

    this.assessmentRoundConfigs.forEach((config, index) => {
      const currentRowValue = this.assessmentRoundsDetailsFormArray
        .at(index)
        .get('assessmentRound')?.value?.[0];

      const filteredOptions = this.cordinatorData.assessmentRounds.filter(
        (option) => {
          const isSelectedSomewhere = allSelectedValues.includes(option.value);
          const isSelectedInThisRow = option.value === currentRowValue;
          return !isSelectedSomewhere || isSelectedInThisRow;
        },
      );

      this.assessmentRoundConfigs[index] = {
        ...config,
        options: filteredOptions,
      };
    });
  }

  private checkStepStatusAndMoveNext(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
        error: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
      });
    }
  }
}
