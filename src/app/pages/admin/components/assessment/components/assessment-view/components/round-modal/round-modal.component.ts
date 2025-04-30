import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  Metadata,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  RoundForm,
  RoundModal,
  RoundsInterface,
} from '../../../../../../models/assessment-schedule.model';
import { assessmentScheduleService } from '../../../../services/assessment-schedule.service';

@Component({
  selector: 'app-round-modal',
  imports: [InputTextComponent, ButtonComponent, ReactiveFormsModule],
  templateUrl: './round-modal.component.html',
  styleUrl: './round-modal.component.scss',
})
export class RoundModalComponent implements OnInit, OnDestroy {
  public data!: RoundForm;
  public metadata!: Metadata[];
  public isEdit = false;
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public roundModal = new RoundModal();
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private storeService: StoreService,
    private messageService: MessageService,
    private router: Router,
    public dialog: DialogService,
    private assessmentScheduleService: assessmentScheduleService,
  ) {
    this.fGroup = buildFormGroup(this.roundModal);
  }

  ngOnInit(): void {
    this.setConfigMaps();
    this.data = this.config.data;
    this.storeService.setIsLoading(false);
  }

  ngOnDestroy(): void {
    this.fGroup.reset();
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    this.CreateRound(this.fGroup.value);
    this.ref.close(this.fGroup.value);
  }

  public onClose() {
    this.ref.close();
  }
  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new RoundModal();
    this.configMap = metadata.configMap || {};
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
    const error = (error: string) => {
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Creation is failed',
      });
    };
    this.assessmentScheduleService.addRound(payload).subscribe({ next, error });
  }
}
