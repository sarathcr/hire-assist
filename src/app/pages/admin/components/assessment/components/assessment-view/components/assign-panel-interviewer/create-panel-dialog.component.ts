import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ConfigMap } from '../../../../../../../../shared/utilities/form.utility';

interface CreatePanelDialogData {
  fGroup: FormGroup;
  configMap: ConfigMap;
}

@Component({
  selector: 'app-create-panel-dialog',
  imports: [
    ReactiveFormsModule,
    InputTextComponent,
    InputTextareaComponent,
    ButtonComponent,
  ],
  template: `
    <div class="create-panel-form">
      <form [formGroup]="data.fGroup">
        <div class="create-panel-form__field-container">
          <app-input-text
            class="create-panel-form__field"
            [formGroup]="data.fGroup"
            type="text"
            [config]="data.configMap['panelName']"
          ></app-input-text>
        </div>
        <div class="create-panel-form__field-container">
          <app-input-textarea
            class="create-panel-form__field"
            [formGroup]="data.fGroup"
            [config]="data.configMap['description']"
          ></app-input-textarea>
        </div>

        <footer class="dialog-footer">
          <div class="dialog-footer__btn-wrapper">
            <app-button
              buttonLabel="Cancel"
              [buttonVariant]="'outlined'"
              (btnClick)="onClose()"
            ></app-button>
          </div>
          <div class="dialog-footer__btn-wrapper">
            <app-button
              buttonLabel="Create"
              [disabled]="!data.fGroup.valid"
              (btnClick)="onSubmit()"
            ></app-button>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [
    `
      .create-panel-form {
        padding: 20px;
      }

      .create-panel-form__field-container {
        margin-bottom: 20px;
      }

      .create-panel-form__field {
        width: 100%;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0px -15px 20px -26px #000;
      }

      .dialog-footer__btn-wrapper {
        min-width: 100px;
      }
    `,
  ],
})
export class CreatePanelDialogComponent implements OnInit {
  public data!: CreatePanelDialogData;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }

  public onSubmit(): void {
    this.data.fGroup.markAllAsTouched();
    if (this.data.fGroup.valid) {
      this.ref.close(this.data.fGroup.value);
    }
  }

  public onClose(): void {
    this.ref.close();
  }
}

