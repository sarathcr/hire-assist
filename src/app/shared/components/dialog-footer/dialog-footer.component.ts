import { Component, OnInit, output } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dialog-footer',
  imports: [ButtonComponent],
  templateUrl: './dialog-footer.component.html',
  styleUrl: './dialog-footer.component.scss',
})
export class DialogFooterComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;
  public btnSubmit = output();

  constructor(
    private ref: DynamicDialogRef,
    private router: Router,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.data = this.config.data;
  }

  public onSubmit() {
    this.ref.close(true);
  }

  public onClose() {
    this.ref.close();
    this.router.navigate(['/candidate/thank-you']);
  }
}
