import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast, ToastModule } from 'primeng/toast';

import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import { ResetPasswordData } from '../../models/reset-password-data.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextComponent,
    ButtonComponent,
    ToastModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetFormGroup: FormGroup;
  isLoading = false;
  configMap!: ConfigMap;

  constructor(
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
  ) {
    this.resetFormGroup = buildFormGroup(new ResetPasswordData());
  }

  ngOnInit(): void {
    this.configMap = new ResetPasswordData().metadata.configMap || {};
  }

  public onSubmit(): void {
    this.resetFormGroup.markAllAsTouched();

    if (this.resetFormGroup.invalid) return;

    this.isLoading = true;
    this.authService.ResetPassword(this.resetFormGroup.value).subscribe({
      next: (res: boolean) => this.handleResetPasswordSuccess(res),
      error: (e: HttpErrorResponse) => this.handleResetPasswordError(e),
    });
  }

  public backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private handleResetPasswordSuccess(res: boolean): void {
    if (res) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password reset link has been sent to your email',
      });
    }
    this.isLoading = false;
  }

  private handleResetPasswordError(error: HttpErrorResponse): void {
    console.error('Reset password error', error);
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please contact Technical Support for account recovery',
    });
  }
}
