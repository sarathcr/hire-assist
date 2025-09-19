import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Tag } from 'primeng/tag';
import { DialogData } from '../../models/dialog.models';

@Component({
  selector: 'app-dialog-header',
  imports: [Tag],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.scss',
})
export class DialogHeaderComponent implements OnInit {
  public data!: DialogData;
  constructor(public config: DynamicDialogConfig) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }
}
