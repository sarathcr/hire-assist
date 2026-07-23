import { Component, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogData } from '../../models/dialog.models';

@Component({
  selector: 'app-dialog',
  imports: [ButtonModule, CommonModule, ProgressSpinnerModule],

  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnInit {
  public btnSubmit = output();

  public data: DialogData = { message: '', isChoice: false };
  public safeMessage!: SafeHtml;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private sanitizer: DomSanitizer,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data ?? { title: '', message: '' };
    if (this.data.isHtml && this.data.message) {
      this.safeMessage = this.sanitizer.bypassSecurityTrustHtml(this.data.message);
    }
  }

  // Public Events
  public onSubmit() {
    this.ref.close(false);
  }

  public onClose() {
    this.ref.close();
  }
}
