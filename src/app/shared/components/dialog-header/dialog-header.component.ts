import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-dialog-header',
  imports: [Tag],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.scss',
})
export class DialogHeaderComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;
  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }
}
