import { Component, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogData } from '../../models/dialog.models';

@Component({
  selector: 'app-dialog',
  imports: [ButtonModule, CommonModule],

  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnInit {
  public btnSubmit = output();

  public data!: DialogData;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data ?? { title: '', message: '' };
  }

  // Public Events
  public onSubmit() {
    this.ref.close(false);
  }

  public onClose() {
    this.ref.close();
  }
}
