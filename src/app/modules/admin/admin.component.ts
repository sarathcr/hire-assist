import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CardComponent } from '../../shared/components/card/card.component';
import { buildFormGroup, ConfigMap } from '../../shared/utilities/form.utility';
import { AssessmentFormModal } from './components/assessment-form-modal/assessment-form-modal.component';
import { AssessmentForm } from './models/assessment-form.model';
import { Assessment } from './models/assessment.model';
import { AssessmentService } from './services/assessment.service';
const menuData = [
  {
    label: 'Assessment',
    items: [
      {
        label: 'Create',
        icon: PrimeIcons.PLUS,
      },
      {
        label: 'Edit',
        icon: PrimeIcons.USER_EDIT,
      },
      {
        label: 'Delete',
        icon: PrimeIcons.TRASH,
      },
    ],
  },
];

export const selectData = [
  { name: 'Completed', code: 'CP' },
  { name: 'Pending', code: 'PD' },
  { name: 'Start', code: 'SR' },
  { name: 'Feedback', code: 'FB' },
];

@Component({
  selector: 'app-admin',
  imports: [CardComponent, ButtonModule, ReactiveFormsModule, CommonModule],
  providers: [AssessmentService, DialogService],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private ref: DynamicDialogRef | undefined;
  public labels: MenuItem[] = menuData;
  public data!: Assessment[];
  public item!: {
    name: string;
    description: string;
    status?: string;
    startDateTime: VarDate;
    endDateTime: Date;
    active: boolean;
  };
  public fGroup!: FormGroup;
  public assessmentFormData = new AssessmentForm();
  public configMap!: ConfigMap;
  inputSelect = selectData;
  constructor(
    public dialog: DialogService,
    private assessmentService: AssessmentService
  ) {
    this.fGroup = buildFormGroup(this.assessmentFormData);
  }
  ngOnInit(): void {
    this.getAllAssessment();
    this.setConfigMaps();
  }

  // Public
  public selectedMenu(item: string) {
    if (item === 'create') {
      this.openCreateAssessmentModal();
    }
  }

  public save() {
    console.log('===>', this.fGroup.value);
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new AssessmentForm();
    this.configMap = metadata.configMap || {};
  }
  // Private
  private openCreateAssessmentModal() {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      inputSelect: this.inputSelect,
    };
    this.ref = this.dialog.open(AssessmentFormModal, {
      data: data,
      header: 'Create Assessment',
      width: '30vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe(res => {
      if (res) {
        this.CreateAssessment(res);
      }
    });
  }

  private getAllAssessment() {
    const next = (res: Assessment[]) => {
      this.data = res;
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.assessmentService.getEntityList().subscribe({ next, error });
  }

  private CreateAssessment(payload: any) {
    const next = (res: Assessment[]) => {
      this.data = res;
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.assessmentService.createEntity(payload).subscribe({ next, error });
  }
}
