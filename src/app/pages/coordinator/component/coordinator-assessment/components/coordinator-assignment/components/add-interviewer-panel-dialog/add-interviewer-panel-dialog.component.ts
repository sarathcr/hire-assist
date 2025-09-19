import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BaseComponent } from 'primeng/basecomponent';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { InterviewPanelFormGroup } from '../../../../../../models/interview-panels.model';

@Component({
  selector: 'app-add-interviewer-panel-dialog',
  imports: [
    ButtonComponent,
    InputTextareaComponent,
    InputTextComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './add-interviewer-panel-dialog.component.html',
  styleUrl: './add-interviewer-panel-dialog.component.scss',
})
export class AddInterviewerPanelDialogComponent
  extends BaseComponent
  implements OnInit
{
  public data!: InterviewPanelFormGroup;

  constructor(private readonly ref: DynamicDialogRef) {
    super();
  }

  override ngOnInit(): void {
    // Ensure `this.data` is initialized with a valid FormGroup and configMap
    if (!this.data || !this.data.fGroup || !this.data.configMap) {
      console.error('data, fGroup, or configMap is not initialized');
    }
  }
  public onSubmit() {
    this.ref.close();
  }
  public onClose() {
    this.ref.close();
  }
}
