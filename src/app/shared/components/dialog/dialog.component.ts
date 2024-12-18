import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface DialogData {
  // name(name: any): unknown;
  message: string;
  title: string;
  isChoice: boolean;
  acceptButtonText?: string;
  cancelButtonText?: string;
  disableClose?: boolean;
}
@Component({
  selector: 'app-dialog',
  imports: [MatDialogModule],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
  ],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  readonly dialogRef = inject(MatDialogRef<DialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  // EVENTS
  public onSubmit() {
    this.dialogRef.close(true);
  }
}
