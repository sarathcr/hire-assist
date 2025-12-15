import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
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
  AssessmentRoundsInterface,
  RoundsInterface,
} from '../../../../../../models/assessment-schedule.model';
import { AssessmentRoundFormGroup } from '../../../../../../models/assessment.model';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { RoundModel } from '../../assessment-view.component';
import { AssessmentRoundSkeletonComponent } from './assessment-round-skeleton';
import { CollectionService } from '../../../../../../../../shared/services/collection.service';
import { CreateRoundModalComponent } from './components/create-round-modal/create-round-modal.component';
@Component({
  selector: 'app-assessment-round',
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    DragDropModule,
    ReactiveFormsModule,
    AssessmentRoundSkeletonComponent,
    ToastModule,
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
  public submittedData: AssessmentRoundFormGroup[] = [];
  public newRoundsToCreate: RoundsInterface[] = [];
  public isLoading = false;

  public assessmentId = input<number>();
  private dialogRef: DynamicDialogRef | undefined;
  @Output() roundsUpdated = new EventEmitter<number>();

  constructor(
    private readonly storeService: StoreService,
    private readonly messageService: MessageService,
    private readonly assessmentScheduleService: AssessmentScheduleService,
    private readonly collectionService: CollectionService,
    private readonly dialogService: DialogService,
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
  }
  ngOnInit(): void {
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();
    this.GetAssessmentRoundbyAssessment();
    this.setupRoundSelectionListener();
  }

  private setupRoundSelectionListener(): void {
    this.fGroup
      .get('round')
      ?.valueChanges.subscribe((selectedRoundIds: string[]) => {
        this.syncSelectedRounds(selectedRoundIds || []);
      });
  }

  private syncSelectedRounds(selectedRoundIds: string[]): void {
    if (!selectedRoundIds || selectedRoundIds.length === 0) {
      this.submittedData = [];
      return;
    }

    if (!this.rounds || this.rounds.length === 0) {
      return;
    }

    const selectedRounds = this.rounds
      .filter((item: Option) => selectedRoundIds.includes(item.value))
      .map((item: Option) => ({
        id: item.value.toString(),
        name: item.label,
      }));

    const existingIds = new Set(this.submittedData.map((item) => item.id));

    this.submittedData = this.submittedData.filter(
      (round) =>
        round.id.startsWith('new-') || selectedRoundIds.includes(round.id),
    );

    const newRounds = selectedRounds.filter(
      (round) => !existingIds.has(round.id),
    );

    this.submittedData = [...this.submittedData, ...newRounds];
  }

  public onDrop(event: CdkDragDrop<AssessmentRoundFormGroup[]>) {
    moveItemInArray(
      this.submittedData,
      event.previousIndex,
      event.currentIndex,
    );
  }

  public onRemoveRound(roundId: string): void {
    // Remove from submitted data
    this.submittedData = this.submittedData.filter(
      (round) => round.id !== roundId,
    );

    // If it's an existing round (not a temp ID), also remove from form selection
    if (roundId.startsWith('new-')) {
      // Remove from newRoundsToCreate if it was a new round
      const removedRound = this.submittedData.find((r) => r.id === roundId);
      if (removedRound) {
        this.newRoundsToCreate = this.newRoundsToCreate.filter(
          (round) => round.name !== removedRound.name,
        );
      }
    } else {
      const currentSelection = this.fGroup.value.round || [];
      this.fGroup.patchValue(
        {
          round: currentSelection.filter((id: string) => id !== roundId),
        },
        { emitEvent: false },
      ); // Prevent triggering valueChanges
    }
    this.roundsUpdated.emit(this.submittedData.length);
  }

  public openCreateRoundModal(): void {
    this.dialogRef = this.dialogService.open(CreateRoundModalComponent, {
      header: 'Create New Round',
      width: '500px',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.dialogRef.onClose.subscribe((result: RoundsInterface | undefined) => {
      console.log('Modal closed with result:', result);
      if (result) {
        this.isLoading = true;
        this.assessmentScheduleService.addRound(result).subscribe({
          next: (createdRound: RoundsInterface) => {
            // Update collection with new round
            if (createdRound?.id) {
              this.collectionService.updateCollection('rounds', {
                id: Number(createdRound.id),
                title: createdRound.name,
              });

              // Add to submitted data with actual ID
              this.submittedData.push({
                id: createdRound.id.toString(),
                name: createdRound.name,
              });

              // Refresh rounds list
              this.refreshRoundsList();

              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Round created successfully!',
              });
            }
            this.isLoading = false;
          },
          error: (error: CustomErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to create round: ${error.error?.type || 'Unknown error'}`,
            });
            this.isLoading = false;
          },
        });
      }
    });
  }

  public onSubmitAll(): void {
    if (this.submittedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select or create at least one round.',
      });
      return;
    }

    this.isLoading = true;

    // Step 1: Create all new rounds first
    const createRoundObservables = this.newRoundsToCreate.map((round) =>
      this.assessmentScheduleService.addRound(round).pipe(
        catchError(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to create round: ${round.name}`,
          });
          return of(null);
        }),
      ),
    );

    // If there are new rounds to create, create them first
    if (createRoundObservables.length > 0) {
      forkJoin(createRoundObservables)
        .pipe(
          switchMap((createdRounds: (RoundsInterface | null)[]) => {
            // Update submittedData with actual IDs from created rounds
            let createdIndex = 0;
            this.submittedData = this.submittedData.map((round) => {
              if (round.id.startsWith('new-')) {
                const createdRound = createdRounds[createdIndex++];
                if (createdRound?.id) {
                  // Update collection with new round
                  this.collectionService.updateCollection('rounds', {
                    id: Number(createdRound.id),
                    title: createdRound.name,
                  });
                  return {
                    ...round,
                    id: createdRound.id.toString(),
                  };
                }
              }
              return round;
            });

            // Refresh rounds list after creation
            this.refreshRoundsList();

            // Step 2: Map all rounds to assessment with sequence
            return this.mapRoundsToAssessment();
          }),
        )
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Rounds saved successfully!',
            });
            this.isLoading = false;
            this.newRoundsToCreate = [];
            // Reload assessment rounds
            this.GetAssessmentRoundbyAssessment();
          },
          error: (error: CustomErrorResponse) => {
            this.handleSubmitError(error);
            this.isLoading = false;
          },
        });
    } else {
      // No new rounds to create, just map existing rounds
      this.mapRoundsToAssessment().subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Rounds saved successfully!',
          });
          this.isLoading = false;
          this.GetAssessmentRoundbyAssessment();
        },
        error: (error: CustomErrorResponse) => {
          this.handleSubmitError(error);
          this.isLoading = false;
        },
      });
    }
  }

  private mapRoundsToAssessment() {
    const payload: AssessmentRoundsInterface[] = this.submittedData.map(
      (item: AssessmentRoundFormGroup, index: number) => ({
        RoundId: Number(item.id),
        name: item.name,
        sequence: index + 1,
      }),
    );

    return this.assessmentScheduleService.CreateAssessmentRound(
      payload,
      Number(this.assessmentId()),
    );
  }

  private handleSubmitError(error: CustomErrorResponse): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `${error.error.type}`,
    });
  }

  private refreshRoundsList(): void {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.rounds = this.optionsMap['rounds'] as unknown as Option[];
    this.configMap['round'] = {
      ...this.configMap['round'],
      options: [...this.rounds],
    };
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
    this.roundsUpdated.emit(this.submittedData.length);
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
}
