import { Component, output } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-dialog-footer',
  imports: [ButtonComponent],
  templateUrl: './dialog-footer.component.html',
  styleUrl: './dialog-footer.component.scss',
})
export class DialogFooterComponent {
  public btnSubmit = output();

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  public onSubmit() {
    this.ref.close(true);
  }

  public onClose() {
    this.ref.close();
  }
}
