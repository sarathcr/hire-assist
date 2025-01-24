import { Component, OnInit, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog',
  imports: [ButtonModule],

  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnInit {
  // Public Events
  public btnSubmit = output();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }

  public onSubmit() {
    this.ref.close(false);
  }

  public onClose() {
    this.ref.close();
  }
}
