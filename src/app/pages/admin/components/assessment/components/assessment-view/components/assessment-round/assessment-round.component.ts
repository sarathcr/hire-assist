import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  input,
} from '@angular/core';
import Sortable from 'sortablejs';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from 'primeng/accordion';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import type { Option } from '../../../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
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
  FeedbackCriteriaConfig,
} from '../../../../../../models/assessment-schedule.model';
import { MultiSelectChangeEvent } from 'primeng/multiselect';
import {
  AssessmentRoundFormGroup,
  RoundModel,
} from '../../../../../../models/assessment.model';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { AssessmentRoundSkeletonComponent } from './assessment-round-skeleton';
import { CollectionService } from '../../../../../../../../shared/services/collection.service';
import { CreateRoundModalComponent } from './components/create-round-modal/create-round-modal.component';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assessment-round',
  standalone: true,
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    AssessmentRoundSkeletonComponent,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    DatePickerModule,
    EditorModule,
    MultiSelectModule,
    DividerModule,
    CardModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    CommonModule,
    Select,
  ],
  templateUrl: './assessment-round.component.html',
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  public readonly MAX_ROUNDS = 10;
  private isUpdatingRounds = false;
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public assessmentSchedule = new AssessmentScheduleModal();
  public optionsMap!: OptionsMap;
  public rounds!: Option[];
  public assessmentRounds!: RoundModel[];
  public submittedData: AssessmentRoundFormGroup[] = [];
  public newRoundsToCreate: RoundsInterface[] = [];
  public isLoading = false;
  public roundConfigForms = new FormArray<FormGroup>([]);
  public feedbackCriteriaOptions: Option[] = [];
  public roundTypeOptions: Option[] = [];
  public isFetchingCriteria = false;
  public isFetchingRoundTypes = false;
  private isFullCriteriaLoaded = false;
  public submitted = false;

  private readonly ROUND_TYPE_APTITUDE = '1';
  private readonly ROUND_TYPE_INTERVIEW = '2';
  private readonly ROUND_TYPE_APTITUDE_LABEL = 'Online Aptitude Test';
  private readonly ROUND_TYPE_INTERVIEW_LABEL = 'Offline Panel Interview';

  public isAptitudeRound(type: any): boolean {
    if (!type) return false;
    const typeStr = type.toString();
    if (typeStr === this.ROUND_TYPE_APTITUDE) return true;

    const option = this.roundTypeOptions.find((o) => o.value === typeStr);
    return option?.label === this.ROUND_TYPE_APTITUDE_LABEL;
  }

  @HostListener('window:resize')
  onResize() {
    // Triggers change detection on window resize
  }

  get isSmallScreen(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 375 : false;
  }

  public assessmentId = input<number>();
  public isReadOnly = input<boolean>(false);
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
    effect(() => {
      if (this.isReadOnly()) {
        this.fGroup.disable({ emitEvent: false });
        this.roundConfigForms.disable({ emitEvent: false });
      } else {
        this.fGroup.enable({ emitEvent: false });
        this.roundConfigForms.enable({ emitEvent: false });
      }
    });
  }
  ngOnInit(): void {
    this.setConfigMaps();
    this.loadCollections();
    this.setOptions();
    this.GetAssessmentRoundbyAssessment();
    this.fetchRoundTypeOptions();
    this.setupRoundSelectionListener();
    this.initialSnapshot = this.getSnapshot();
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
        if (this.isUpdatingRounds) {
          return;
        }
        this.syncSelectedRounds(selectedRoundIds);
      });
  }

  public onRoundSelectionChange(event: MultiSelectChangeEvent): void {
    this.handleRoundSelectionChange(event.value);
  }

  private handleRoundSelectionChange(selectedRoundIds: string[]): void {
    if (selectedRoundIds && selectedRoundIds.length > this.MAX_ROUNDS) {
      this.isUpdatingRounds = true;
      const truncatedIds = selectedRoundIds.slice(0, this.MAX_ROUNDS);

      // Use setTimeout to ensure the value update happens after the current event loop
      setTimeout(() => {
        this.fGroup
          .get('round')
          ?.setValue([...truncatedIds], { emitEvent: false });
        this.fGroup.get('round')?.updateValueAndValidity();
        this.cdr.detectChanges();
        this.isUpdatingRounds = false;
      }, 100);

      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${this.MAX_ROUNDS} rounds are allowed. Extra selections have been removed.`,
      });
      this.syncSelectedRounds(truncatedIds);
    } else {
      this.syncSelectedRounds(selectedRoundIds);
    }
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
      .filter(
        (item: Option) =>
          item.value !== undefined && selectedRoundIds.includes(item.value),
      )
      .map((item: Option) => ({
        id: item.value?.toString() || '',
        name: item.label || '',
        timerHour: 0,
        durationDate: new Date(new Date().setHours(0, 0, 0, 0)),
        maxTerminationCount: 0,
      }));

    const existingIds = new Set(this.submittedData.map((item) => item.id));
    const existingData = this.submittedData.filter(
      (round) =>
        round.id.startsWith('new-') || selectedRoundIds.includes(round.id),
    );

    const newRounds = selectedRounds.filter(
      (round) => !existingIds.has(round.id),
    );

    this.submittedData = [
      ...existingData,
      ...(newRounds as AssessmentRoundFormGroup[]),
    ];
    this.buildRoundConfigForms();
    this.reinitSortable();
  }

  public getCriteriaFormArray(roundIdx: number): FormArray {
    return this.getRoundFormGroup(roundIdx).get(
      'feedbackCriteria',
    ) as FormArray;
  }

  public addCriteria(roundIdx: number): void {
    const criteriaArray = this.getCriteriaFormArray(roundIdx);
    criteriaArray.push(this.createCriteriaFormGroup());
    this.cdr.detectChanges();
  }

  public removeCriteria(roundIdx: number, criteriaIdx: number): void {
    const group = this.getRoundFormGroup(roundIdx);
    const criteriaArray = group.get('feedbackCriteria') as FormArray;
    const removedItem = criteriaArray.at(criteriaIdx).value;

    criteriaArray.removeAt(criteriaIdx);

    // If it was an imported item, remove it from the dropdown selection too
    if (removedItem.isImported) {
      const selectionCtrl = group.get('importSelection');
      const currentSelection = selectionCtrl?.value || [];
      const removedId = removedItem.id?.toString();

      if (removedId) {
        selectionCtrl?.setValue(
          currentSelection.filter((val: any) => val?.toString() !== removedId),
          { emitEvent: true },
        );
      }
    }

    this.cdr.detectChanges();
  }

  public onCriteriaTitleChange(criteriaIdx: number, roundIdx: number): void {
    const group = this.getRoundFormGroup(roundIdx);
    const criteriaArray = group.get('feedbackCriteria') as FormArray;
    const criteriaControl = criteriaArray.at(criteriaIdx);

    if (criteriaControl) {
      const titleControl = criteriaControl.get('title');
      if (titleControl && typeof titleControl.value === 'string') {
        const rawTitle = titleControl.value;
        if (/\s{2,}/.test(rawTitle)) {
          const sanitizedTitle = rawTitle.replace(/\s{2,}/g, ' ');
          titleControl.setValue(sanitizedTitle, { emitEvent: false });
        }
      }

      if (criteriaControl.get('isImported')?.value) {
        const newTitle = criteriaControl.get('title')?.value?.trim();
        const removedId = criteriaControl.get('id')?.value?.toString();

        // If the title is empty or just whitespace, don't remove it yet
        if (!newTitle) return;

        const originalOption = this.feedbackCriteriaOptions.find(
          (o) => o.value?.toString() === removedId,
        );

        // If the trimmed title matches the original label, it's just spaces added, so don't remove
        if (originalOption && originalOption.label === newTitle) return;

        criteriaControl
          .get('isImported')
          ?.setValue(false, { emitEvent: false });

        const selectionCtrl = group.get('importSelection');
        const currentSelection = selectionCtrl?.value || [];

        if (removedId) {
          selectionCtrl?.setValue(
            currentSelection.filter(
              (val: any) => val?.toString() !== removedId,
            ),
            { emitEvent: true },
          );
        }
      }
    }
  }

  private specialCharactersOnlyValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Reject if it doesn't contain any letter (supports international characters)
    if (!/\p{L}/u.test(value)) {
      return { specialCharactersOnly: true };
    }

    return null;
  }

  private createCriteriaFormGroup(data?: FeedbackCriteriaConfig): FormGroup {
    return new FormGroup({
      id: new FormControl(data?.id || null),
      title: new FormControl(data?.title || '', [
        Validators.required,
        Validators.pattern(/^[^0-9]*$/),
        this.specialCharactersOnlyValidator.bind(this),
        Validators.minLength(3),
        Validators.maxLength(30),
        this.duplicateTitleValidator.bind(this),
      ]),
      description: new FormControl(data?.description || '', [
        this.plainTextMaxLengthValidator(1000),
      ]),
      maxScore: new FormControl(data?.maxScore || 10, [
        Validators.required,
        Validators.min(1),
        Validators.max(100),
        Validators.pattern(/^[0-9]+$/),
      ]),
      isImported: new FormControl(data?.isImported || false),
    });
  }


  public onExistingCriteriaSelected(event: any, idx: number): void {
    const selectedValues = ((event.value as any[]) || []).map((v) =>
      v?.toString(),
    );
    const feedbackCriteria = this.getCriteriaFormArray(idx);

    // 1. Identify which imported items were DESELECTED in the dropdown
    // First, collect all controls that need to be removed to avoid index shift issues
    const controlsToRemove: number[] = [];

    feedbackCriteria.controls.forEach((control, i) => {
      if (control.get('isImported')?.value) {
        const id = control.get('id')?.value?.toString();
        // If the item has an ID and it's NOT in the new selection, mark for removal
        if (id && !selectedValues.includes(id)) {
          controlsToRemove.push(i);
        }
      }
    });

    // Remove from end to start to maintain index stability
    controlsToRemove
      .sort((a, b) => b - a)
      .forEach((i) => {
        feedbackCriteria.removeAt(i);
      });

    // 2. Identify which items were SELECTED in the dropdown but ARE NOT in the list
    selectedValues.forEach((val) => {
      // Find the option by its value (ID or Title)
      const option = this.feedbackCriteriaOptions.find(
        (o) => o.value?.toString() === val,
      );

      if (option && option.label) {
        // Check if this specific item already exists in the list (match by ID OR Title)
        const alreadyExists = feedbackCriteria.value.some(
          (c: any) =>
            c.isImported &&
            (c.id?.toString() === val || c.title === option.label),
        );

        if (!alreadyExists) {
          feedbackCriteria.push(
            this.createCriteriaFormGroup({
              id: option.value,
              title: option.label,
              description: (option as any).description || '',
              maxScore: (option as any).maxScore || 10,
              isImported: true,
            }),
          );
        }
      }
    });

    this.cdr.detectChanges();
  }

  public fetchCriteriaOptions(): void {
    if (this.isFetchingCriteria || this.isFullCriteriaLoaded) {
      return;
    }

    this.isFetchingCriteria = true;
    this.assessmentScheduleService
      .GetExceptCommonFeedbackCriteria()
      .pipe(
        catchError(() => {
          this.isFetchingCriteria = false;
          return of([]);
        }),
      )
      .subscribe((response: any) => {
        // Handle both raw array and { data: [] } response shapes
        const criteria = Array.isArray(response)
          ? response
          : response?.data || response?.items || [];

        this.feedbackCriteriaOptions = criteria.map((c: any) => ({
          label:
            c.label ||
            c.title ||
            c.Title ||
            c.name ||
            c.Name ||
            c.criteriaTitle ||
            c.criteria_title ||
            c.criteriaName ||
            c.criteria_name ||
            'Untitled',
          value: (
            c.value ||
            c.id ||
            c.Id ||
            c.title ||
            c.Title ||
            c.name ||
            c.Name
          )?.toString(),
          description:
            c.description || c.Description || c.criteria_description || '',
          maxScore: c.maxScore || c.MaxScore || c.max_score || 10,
        })) as any[];

        this.isFetchingCriteria = false;
        this.isFullCriteriaLoaded = true;
      });
  }

  public fetchRoundTypeOptions(): void {
    if (this.isFetchingRoundTypes) {
      return;
    }

    this.isFetchingRoundTypes = true;
    this.collectionService
      .GetRoundTypes()
      .pipe(
        catchError(() => {
          this.isFetchingRoundTypes = false;
          // Fallback options if API fails
          this.roundTypeOptions = [
            {
              label: this.ROUND_TYPE_APTITUDE_LABEL,
              value: this.ROUND_TYPE_APTITUDE,
            },
            {
              label: this.ROUND_TYPE_INTERVIEW_LABEL,
              value: this.ROUND_TYPE_INTERVIEW,
            },
          ];
          return of(this.roundTypeOptions);
        }),
      )
      .subscribe((response: any) => {
        const types = Array.isArray(response) ? response : response?.data || [];
        if (types.length > 0) {
          this.roundTypeOptions = types.map((t: any) => ({
            label:
              t.label || t.name || t.Title || t.roundTypeName || 'Untitled',
            value: (
              t.value ||
              t.id ||
              t.roundType ||
              t.label ||
              t.name
            )?.toString(),
          }));
        } else {
          // Fallback if empty array
          this.roundTypeOptions = [
            {
              label: this.ROUND_TYPE_APTITUDE_LABEL,
              value: this.ROUND_TYPE_APTITUDE,
            },
            {
              label: this.ROUND_TYPE_INTERVIEW_LABEL,
              value: this.ROUND_TYPE_INTERVIEW,
            },
          ];
        }
        this.isFetchingRoundTypes = false;

        // After options are loaded, rebuild forms if data already exists to fix validators
        if (this.submittedData && this.submittedData.length > 0) {
          this.buildRoundConfigForms();
        }

        this.cdr.detectChanges();
      });
  }

  private initSortable(): void {
    this.destroySortable();

    // Never allow drag-to-reorder when in read-only mode
    if (this.isReadOnly()) {
      return;
    }

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

  public onEditorInit(event: any): void {
    const quill = event.editor;
    const limit = 1000;

    quill.on('text-change', (delta: any, oldDelta: any, source: any) => {
      // Use setTimeout to ensure Quill finished internal updates
      if (source === 'user') {
        setTimeout(() => {
          if (quill.getLength() > limit + 1) {
            quill.deleteText(limit, quill.getLength());
          }
        }, 0);
      }
    });
  }

  private plainTextMaxLengthValidator(limit: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      // Strip HTML and common entities to get true text length
      const text = control.value
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text.length > limit
        ? { maxlength: { requiredLength: limit, actualLength: text.length } }
        : null;
    };
  }

  private duplicateTitleValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const title = control.value?.toLowerCase().trim();
    if (!title) return null;

    const formGroup = control.parent;
    if (!formGroup) return null;

    const formArray = formGroup.parent as FormArray;
    if (!formArray) return null;

    const isDuplicate = formArray.controls.some((group) => {
      if (group === formGroup) return false;
      return group.get('title')?.value?.toLowerCase().trim() === title;
    });

    return isDuplicate ? { duplicateTitle: true } : null;
  }

  public stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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

            const movedControl = this.roundConfigForms.at(evt.oldIndex);
            this.roundConfigForms.removeAt(evt.oldIndex);
            this.roundConfigForms.insert(evt.newIndex, movedControl);
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
    const removedRound = this.submittedData.find((r) => r.id === roundId);

    // Remove from submitted data
    this.submittedData = this.submittedData.filter(
      (round) => round.id !== roundId,
    );

    // If it's an existing round (not a temp ID), also remove from form selection
    if (roundId.startsWith('new-')) {
      // Remove from newRoundsToCreate if it was a new round
      if (removedRound) {
        this.newRoundsToCreate = this.newRoundsToCreate.filter(
          (round) => round.name !== removedRound.name,
        );
      }
      this.buildRoundConfigForms();
      this.reinitSortable();
    } else {
      const currentSelection = this.fGroup.value.round || [];
      this.fGroup.patchValue({
        round: currentSelection.filter((id: string) => id !== roundId),
      }); // Allow emitting event to sync PrimeNG MultiSelect correctly!
    }
    this.roundsUpdated.emit(this.submittedData.length);
  }

  public openCreateRoundModal(): void {
    if (this.submittedData.length >= this.MAX_ROUNDS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${this.MAX_ROUNDS} rounds are allowed. Please remove a round before creating a new one.`,
      });
      return;
    }

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

  public getRoundFormGroup(idx: number): FormGroup {
    return this.roundConfigForms.at(idx) as FormGroup;
  }

  public getErrorMessage(idx: number, controlName: string): string {
    const group = this.getRoundFormGroup(idx);
    const fc = group.get(controlName);

    if (!fc || !fc.touched || !fc.errors) {
      return '';
    }

    const errors = fc.errors;

    if (errors['required']) {
      return 'This field is required.';
    }

    if (errors['pattern']) {
      if (controlName === 'maxTerminationCount') {
        return 'Number of tries must be a whole number.';
      }
    }

    if (errors['min']) {
      return `Value must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      if (controlName === 'maxTerminationCount') {
        return `Maximum ${errors['max'].max} tries allowed.`;
      }
      return `Value must be no more than ${errors['max'].max}.`;
    }

    if (errors['invalidDuration']) {
      return 'Duration cannot be 00:00.';
    }

    return 'This field has an invalid value.';
  }

  public buildRoundConfigForms(): void {
    this.roundConfigForms.clear();
    for (const data of this.submittedData) {
      // Infer initial round type if not present
      let initialRoundType = data.roundType;
      if (!initialRoundType) {
        const lowerName = data.name?.toLowerCase() || '';
        if (
          lowerName.includes('aptitude') ||
          lowerName.includes('online test')
        ) {
          initialRoundType = this.ROUND_TYPE_APTITUDE;
        } else {
          initialRoundType = this.ROUND_TYPE_INTERVIEW;
        }
        data.roundType = initialRoundType;
      }

      const isAptitude = this.isAptitudeRound(initialRoundType);

      const group = new FormGroup({
        roundType: new FormControl(initialRoundType, [Validators.required]),
        duration: new FormControl(data.durationDate, [
          Validators.required,
          (control) => {
            const val = control.value;
            if (
              val &&
              val instanceof Date &&
              val.getHours() === 0 &&
              val.getMinutes() === 0
            ) {
              return { invalidDuration: true };
            }
            return null;
          },
        ]),
        maxTerminationCount: new FormControl(
          data.maxTerminationCount,
          isAptitude
            ? [
                Validators.required,
                Validators.min(1),
                Validators.max(10),
                Validators.pattern('^[0-9]+$'),
              ]
            : [],
        ),
        feedbackCriteria: new FormArray(
          (data.feedbackCriteria || []).map((c) =>
            this.createCriteriaFormGroup(c),
          ),
          !isAptitude ? [Validators.required, Validators.minLength(1)] : [],
        ),
        importSelection: new FormControl(
          (data.feedbackCriteria || [])
            .filter((c) => c.isImported)
            .map((c) => c.id?.toString()),
        ),
      });

      group.get('roundType')?.valueChanges.subscribe((type) => {
        data.roundType = (type as string) || undefined;
        const isNowAptitude = this.isAptitudeRound(type);

        const countCtrl = group.get('maxTerminationCount');
        const criteriaArray = group.get('feedbackCriteria') as FormArray;

        if (isNowAptitude) {
          countCtrl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(10),
            Validators.pattern('^[0-9]+$'),
          ]);
          criteriaArray.setValidators([]);
        } else {
          countCtrl?.setValidators([]);
          countCtrl?.setValue(0);
          criteriaArray.setValidators([
            Validators.required,
            Validators.minLength(1),
          ]);
        }

        countCtrl?.updateValueAndValidity();
        criteriaArray.updateValueAndValidity();
        this.cdr.detectChanges();
      });

      // Sync FormControl values back to submittedData on change
      group.get('duration')?.valueChanges.subscribe((val) => {
        data.durationDate = val ?? undefined;
      });
      group.get('maxTerminationCount')?.valueChanges.subscribe((val) => {
        data.maxTerminationCount = val ?? undefined;
      });

      group.get('feedbackCriteria')?.valueChanges.subscribe((val) => {
        data.feedbackCriteria = (val as FeedbackCriteriaConfig[]) ?? [];

        // Trigger re-validation for all titles to catch duplicates
        const criteriaArray = group.get('feedbackCriteria') as FormArray;
        criteriaArray.controls.forEach((c) => {
          c.get('title')?.updateValueAndValidity({ emitEvent: false });
        });
      });

      this.roundConfigForms.push(group);
    }

    // Disable ALL config form controls if in read-only mode
    if (this.isReadOnly()) {
      this.roundConfigForms.disable({ emitEvent: false });
    }
  }

  public onSubmitAll(): void {
    this.submitted = true;
    if (this.submittedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select or create at least one round.',
      });
      return;
    }

    if (this.submittedData.length > this.MAX_ROUNDS) {
      this.messageService.add({
        severity: 'error',
        summary: 'Limit Exceeded',
        detail: `Maximum ${this.MAX_ROUNDS} rounds are allowed. Please remove some rounds before saving.`,
      });
      return;
    }

    // Validate: check duration is not 00:00 for each round
    let hasInvalidDuration = false;
    this.roundConfigForms.controls.forEach((group) => {
      const durationCtrl = group.get('duration');
      const val = durationCtrl?.value;
      if (!val || (val.getHours() === 0 && val.getMinutes() === 0)) {
        durationCtrl?.setErrors({ required: true });
        hasInvalidDuration = true;
      }
    });

    this.roundConfigForms.markAllAsTouched();

    if (this.roundConfigForms.invalid || hasInvalidDuration) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields for each round.',
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
        roundId: Number(item.id),
        round: item.name,
        sequence: index + 1,
        timerHour: item.durationDate
          ? `${item.durationDate.getHours().toString().padStart(2, '0')}:` +
            `${item.durationDate.getMinutes().toString().padStart(2, '0')}:` +
            `${item.durationDate.getSeconds().toString().padStart(2, '0')}`
          : '00:00:00',
        maxTerminationCount: item.maxTerminationCount || 0,
        roundTypeId: item.roundType ? Number(item.roundType) : 0,
        isActive: true,
        assessmentRoundFeedbackCriteria: (item.feedbackCriteria || []).map(
          (c: any) => {
            const rawDescription = c.description || '';
            const plainText = rawDescription.replace(/<[^>]*>/g, '').trim();
            const finalDescription = plainText === '' ? null : rawDescription;

            return {
              feedbackCriteriaId:
                c.id && !isNaN(Number(c.id)) ? Number(c.id) : 0,
              criteriaName: c.title,
              description: finalDescription,
              maxScore: c.maxScore || 10,
            };
          },
        ),
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
      options: [...this.rounds] as any[],
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

          // Seed dropdown options from response data BEFORE building the forms
          const allCriteriaOptions: Option[] = [];
          response.forEach((item) => {
            const criteriaList = ((item as any)
              .assessmentRoundFeedbackCriteria || []) as any[];
            criteriaList.forEach((fc) => {
              if (fc.feedbackCriteriaId && fc.feedbackCriteriaId !== 0) {
                const exists = allCriteriaOptions.some(
                  (o) =>
                    o.value?.toString() === fc.feedbackCriteriaId.toString(),
                );
                if (!exists) {
                  allCriteriaOptions.push({
                    label: fc.criteriaName,
                    value: fc.feedbackCriteriaId.toString(),
                  });
                }
              }
            });
          });

          if (allCriteriaOptions.length > 0) {
            this.feedbackCriteriaOptions = [
              ...this.feedbackCriteriaOptions,
              ...allCriteriaOptions,
            ];
          }

          this.submittedData = [...response]
            .sort((a, b) => a.sequence - b.sequence)
            .map((item) => {
              const date = new Date();

              if (item.timerHour) {
                const timeString =
                  typeof item.timerHour === 'string'
                    ? item.timerHour
                    : '00:00:00';
                const [h, m, s] = timeString.split(':').map(Number);
                date.setHours(h || 0, m || 0, s || 0, 0);
              } else {
                date.setHours(0, 0, 0, 0);
              }

              const criteriaList = ((item as any)
                .assessmentRoundFeedbackCriteria || []) as any[];
              return {
                name: item.round,
                id: item.roundId.toString(),
                sequence: item.sequence,
                timerHour: item.timerHour || 0,
                durationDate: date,
                maxTerminationCount: item.maxTerminationCount || 0,
                feedbackCriteria: criteriaList.map((fc: any) => ({
                  id: fc.feedbackCriteriaId || fc.id,
                  title: fc.criteriaName,
                  description: fc.description || '',
                  maxScore: fc.maxScore || 10,
                  isImported:
                    !!fc.feedbackCriteriaId && fc.feedbackCriteriaId !== 0,
                })),
                roundType: item.roundTypeId?.toString(),
              };
            });

          // Truncate if existing rounds exceed limit
          if (this.submittedData.length > this.MAX_ROUNDS) {
            this.submittedData = this.submittedData.slice(0, this.MAX_ROUNDS);
          }

          this.fGroup.patchValue(
            { round: this.submittedData.map((item) => item.id) },
            { emitEvent: false },
          );
          this.buildRoundConfigForms();
          this.initialSnapshot = this.getSnapshot();
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
    ] as any[];
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.rounds = this.optionsMap['rounds'] as unknown as Option[];
  }

  public getRoundTypeLabel(idx: number): string {
    const value = this.getRoundFormGroup(idx).get('roundType')?.value;
    if (!value) return '';
    const option = this.roundTypeOptions.find(
      (o) => o.value === value.toString(),
    );
    return option?.label || value.toString();
  }

  private initialSnapshot = '';

  private getSnapshot(): string {
    if (!this.submittedData) return '';
    return JSON.stringify(
      this.submittedData.map((d) => ({
        id: d.id,
        name: d.name,
        roundType: d.roundType,
        maxTerminationCount: d.maxTerminationCount,
        duration: d.durationDate
          ? `${d.durationDate.getHours()}:${d.durationDate.getMinutes()}`
          : '',
        criteria: (d.feedbackCriteria || []).map((c) => ({
          id: c.id,
          title: (c.title || '').trim(),
          description: (c.description || '').trim(),
          maxScore: c.maxScore,
        })),
      })),
    );
  }

  public get isDirty(): boolean {
    if (!this.initialSnapshot) return false;
    return (
      this.getSnapshot() !== this.initialSnapshot ||
      this.newRoundsToCreate.length > 0
    );
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
