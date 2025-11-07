/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  interviewer,
  interviewerModal,
} from '../../../../../../models/interviewers-model';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
@Component({
  selector: 'app-assign-interviewers-dialogue',
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    InputSelectComponent,
  ],
  templateUrl: './assign-interviewers-dialogue.component.html',
  styleUrl: './assign-interviewers-dialogue.component.scss',
})
export class AssignInterviewersDialogueComponent implements OnInit {
  // Public Properties
  public data!: interviewer;
  public optionsMap!: OptionsMap;
  public interviewers!: Option[];
  public panels!: Option[];
  public interviewersData: any;
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public interviewerSchedule = new interviewerModal();
  public isEdit = false;
  constructor(
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly storeService: StoreService,
    public dialog: DialogService,
  ) {
    this.fGroup = buildFormGroup(this.interviewerSchedule);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = !!this.data.formData?.id;
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    const users = this.optionsMap['interviewers'] as unknown as Option[];
    this.interviewers = users.filter((user) =>
      user.roles?.includes('Interviewer'),
    );
    this.panels = this.optionsMap['panels'] as unknown as Option[];
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();

    if (this.isEdit) {
      const panelId =
        this.data.formData.panelId || this.data.formData.panelName;
      const interviewers = this.data.formData.interviewers;
      this.fGroup.patchValue({
        interviewers: interviewers || [],
        panels: panelId ?? null,
      });
    } else {
      this.fGroup.patchValue({
        interviewers: [],
        panels: null,
      });
    }
  }

  public getPanelNames(): string {
    const panelValue = this.fGroup.get('panels')?.value;
    if (!panelValue) return '';
    const panelIds = (
      Array.isArray(panelValue) ? panelValue : [panelValue]
    ).map(String);

    const panelNames = this.panels
      .filter((p) => panelIds.includes(String(p.value)))
      .map((p) => p.label);
    const data = panelNames.join(', ');
    return data;
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    if (this.isEdit && this.ref) {
      const id = this.data?.formData?.id;
      this.ref.close({ ...this.fGroup.value, id });
    } else {
      this.ref.close(this.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new interviewerModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['interviewers'] as CustomSelectConfig).options = this
      .optionsMap['interviewers'] as unknown as Option[];

    (this.configMap['panels'] as CustomSelectConfig).options = this.optionsMap[
      'panels'
    ] as unknown as Option[];
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.interviewers = this.optionsMap['interviewers'] as unknown as Option[];
  }
}
