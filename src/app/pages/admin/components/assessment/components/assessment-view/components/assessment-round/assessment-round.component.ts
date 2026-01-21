import {
  Component,
  EventEmitter,
  input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import Sortable from 'sortablejs';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of, Subscription } from 'rxjs';
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
import { StepsStatusService } from '../../../../services/steps-status.service';
@Component({
  selector: 'app-assessment-round',
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    AssessmentRoundSkeletonComponent,
    ToastModule,
  ],
  templateUrl: './assessment-round.component.html',
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
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
  private assessmentRoundSubscription?: Subscription;
  private isDataLoaded = false;
  private sortableInstance: Sortable | null = null;
  @ViewChild('roundsList', { static: false }) roundsListRef!: ElementRef;
  @Output() roundsUpdated = new EventEmitter<number>();

  constructor(
    private readonly storeService: StoreService,
    private readonly messageService: MessageService,
    private readonly assessmentScheduleService: AssessmentScheduleService,
    private readonly collectionService: CollectionService,
    private readonly dialogService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly stepsStatusService: StepsStatusService,
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

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (
        this.submittedData &&
        this.submittedData.length > 0 &&
        !this.isLoading
      ) {
        this.initSortable();
      }
    }, 500);
  }

  ngAfterViewChecked(): void {
    if (
      !this.isLoading &&
      this.submittedData &&
      this.submittedData.length > 0 &&
      !this.sortableInstance
    ) {
      const element =
        this.roundsListRef?.nativeElement ||
        (document.querySelector(
          '.assessment-round__rounds-list',
        ) as HTMLElement);
      if (
        element &&
        element.querySelectorAll('.assessment-round__round-item').length > 0
      ) {
        setTimeout(() => {
          this.initSortable();
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.assessmentRoundSubscription) {
      this.assessmentRoundSubscription.unsubscribe();
      this.assessmentRoundSubscription = undefined;
    }
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
      this.destroySortable();
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
    const existingData = this.submittedData.filter(
      (round) =>
        round.id.startsWith('new-') || selectedRoundIds.includes(round.id),
    );

    const newRounds = selectedRounds.filter(
      (round) => !existingIds.has(round.id),
    );

    this.submittedData = [...existingData, ...newRounds];
    setTimeout(() => this.reinitSortable(), 300);
  }

  private initSortable(): void {
    this.destroySortable();

    if (this.submittedData.length === 0 || this.isLoading) {
      return;
    }

    if (typeof Sortable === 'undefined') {
      return;
    }

    const getElement = (): HTMLElement | null => {
      if (this.roundsListRef?.nativeElement) {
        return this.roundsListRef.nativeElement;
      }
      return document.querySelector(
        '.assessment-round__rounds-list',
      ) as HTMLElement;
    };

    let element = getElement();

    if (!element) {
      setTimeout(() => {
        element = getElement();
        if (
          element &&
          this.submittedData &&
          this.submittedData.length > 0 &&
          !this.isLoading
        ) {
          this.initializeSortableOnElement(element);
        }
      }, 300);
      return;
    }

    this.initializeSortableOnElement(element);
  }

  private initializeSortableOnElement(element: HTMLElement): void {
    const items = element.querySelectorAll('.assessment-round__round-item');

    if (items.length === 0) {
      return;
    }

    try {
      this.sortableInstance = new Sortable(element, {
        animation: 200,
        ghostClass: 'assessment-round__sortable-ghost',
        chosenClass: 'assessment-round__sortable-chosen',
        dragClass: 'assessment-round__sortable-drag',
        forceFallback: true,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        draggable: '.assessment-round__round-item',
        filter: '.assessment-round__remove-button',
        preventOnFilter: false,
        onStart: () => {
          element.classList.add('sortable-dragging');
        },
        onEnd: (evt) => {
          element.classList.remove('sortable-dragging');
          if (
            evt.oldIndex !== undefined &&
            evt.newIndex !== undefined &&
            evt.oldIndex !== evt.newIndex
          ) {
            const movedItem = this.submittedData[evt.oldIndex];
            this.submittedData.splice(evt.oldIndex, 1);
            this.submittedData.splice(evt.newIndex, 0, movedItem);
            this.submittedData = [...this.submittedData];
          }
        },
      });
    } catch (error) {
      // Error handling - SortableJS initialization failed
    }
  }

  private destroySortable(): void {
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
      this.sortableInstance = null;
    }
  }

  private reinitSortable(): void {
    this.destroySortable();
    setTimeout(() => {
      if (
        this.submittedData &&
        this.submittedData.length > 0 &&
        !this.isLoading
      ) {
        this.initSortable();
      }
    }, 500);
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
    this.reinitSortable();
  }

  public openCreateRoundModal(): void {
    this.dialogRef = this.dialogService.open(CreateRoundModalComponent, {
      header: 'Create New Round',
      width: '500px',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.dialogRef.onClose.subscribe((result: RoundsInterface | undefined) => {
      if (result) {
        this.isLoading = true;
        this.assessmentScheduleService.addRound(result).subscribe({
          next: (createdRound: RoundsInterface) => {
            if (createdRound?.id) {
              const newRoundId = createdRound.id.toString();

              this.collectionService.updateCollection('rounds', {
                id: Number(createdRound.id),
                title: createdRound.name,
              });

              this.refreshRoundsList();

              const currentSelection = this.fGroup.get('round')?.value || [];
              this.fGroup.patchValue({
                round: [...currentSelection, newRoundId],
              });

              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Round created successfully!',
                life: 10000,
              });
            }
            this.isLoading = false;
          },
          error: (error: CustomErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to create round: ${
                error.error?.type || 'Unknown error'
              }`,
            });
            this.isLoading = false;
            setTimeout(() => {
              this.reinitSortable();
            }, 500);
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
            this.isDataLoaded = false;
            this.GetAssessmentRoundbyAssessment();
            setTimeout(() => this.reinitSortable(), 500);
            // Call step status API and move to next step
            this.checkStepStatusAndMoveNext();
          },
          error: (error: CustomErrorResponse) => {
            this.isLoading = false;
            this.handleSubmitError(error);
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
          this.isDataLoaded = false;
          this.GetAssessmentRoundbyAssessment();
          setTimeout(() => this.reinitSortable(), 600);
          // Call step status API and move to next step
          this.checkStepStatusAndMoveNext();
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
    setTimeout(() => {
      this.reinitSortable();
    }, 500);
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
    // Prevent duplicate API calls - if already loading or subscription exists, skip
    if (this.isLoading || this.assessmentRoundSubscription) {
      return;
    }

    // Check if assessmentId is valid
    const assessmentId = Number(this.assessmentId());
    if (!assessmentId || isNaN(assessmentId)) {
      return;
    }

    this.isLoading = true;
    this.assessmentRoundSubscription = this.assessmentScheduleService
      .GetAssessmentRound(assessmentId)
      .subscribe({
        next: (response: RoundModel[]) => {
          this.isLoading = false;
          this.isDataLoaded = true;
          this.assessmentRounds = response;
          this.submittedData = response.map((item) => ({
            name: item.round,
            id: item.roundId.toString(),
            sequence: item.sequence,
          }));
          this.fGroup.patchValue({
            round: this.submittedData.map((item) => item.id),
          });
          this.assessmentRoundSubscription = undefined;
          this.roundsUpdated.emit(this.submittedData.length);
          this.cdr.detectChanges();
          setTimeout(() => {
            this.reinitSortable();
          }, 1000);
        },
        error: () => {
          this.isLoading = false;
          this.assessmentRoundSubscription = undefined;
          setTimeout(() => {
            this.reinitSortable();
          }, 500);
        },
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

  private checkStepStatusAndMoveNext(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          // Notify parent to move to next step
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
        error: () => {
          // Even if step status API fails, try to move to next step
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
      });
    }
  }
}
