/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AssessmentSchedule,
  AssessmentScheduleModal,
} from '../../../../../../models/assessment-schedule.model';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { RoundModalComponent } from '../round-modal/round-modal.component';

@Component({
  selector: 'app-assessment-schedule-modal',
  imports: [InputMultiselectComponent, ButtonComponent, ReactiveFormsModule],
  templateUrl: './assessment-schedule-modal.component.html',
  styleUrl: './assessment-schedule-modal.component.scss',
})
export class AssessmentScheduleModalComponent implements OnInit {
  public data!: AssessmentSchedule;
  public optionsMap!: OptionsMap;
  public rounds!: Option[];
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public assessmentSchedule = new AssessmentScheduleModal();

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private storeService: StoreService,
    public dialog: DialogService,
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.rounds = this.optionsMap['rounds'] as unknown as Option[];
    this.setConfigMaps();
    this.setOptions();
  }

  // Public Methods
  public openAddRoundModal(): void {
    const data = {
      configMap: this.configMap || {},
      formData: {},
    };
    this.ref = this.dialog.open(RoundModalComponent, {
      data: data,
      header: 'Select Rounds',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe();
  }
  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      this.ref.close(this.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new AssessmentScheduleModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['round'] as any).options = this.optionsMap['rounds'];
  }
}
