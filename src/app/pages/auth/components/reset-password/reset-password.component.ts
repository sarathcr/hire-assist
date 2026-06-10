import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CarouselModule } from 'primeng/carousel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import { ResetPasswordData } from '../../models/reset-password-data.model';
import { AuthService } from '../../services/auth.service';

interface Slide {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextComponent,
    ButtonComponent,
    CarouselModule,
    ConfirmDialogModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  public resetFormGroup: FormGroup;
  public isLoading = false;
  public isEmailSent = false;
  public configMap!: ConfigMap;
  public cooldownTimeRemaining = 0;
  private cooldownInterval: any;
  public slides: Slide[] = [
    {
      title: 'Streamline Your Hiring Process',
      description: 'Efficiently manage candidates, interviews, and assessments all in one place.',
      icon: '👥',
    },
    {
      title: 'Smart Candidate Assessment',
      description: 'Evaluate candidates with comprehensive tools and real-time analytics.',
      icon: '📊',
    },
    {
      title: 'Collaborative Interview Management',
      description: 'Coordinate with your team and schedule interviews seamlessly.',
      icon: '🤝',
    },
    {
      title: 'Data-Driven Decisions',
      description: 'Make informed hiring decisions with detailed insights and reports.',
      icon: '📈',
    },
  ];
  public responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly authService: AuthService,
  ) {
    this.resetFormGroup = buildFormGroup(new ResetPasswordData());
  }

  ngOnInit(): void {
    this.configMap = new ResetPasswordData().metadata.configMap || {};
    this.checkCooldown();
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  private checkCooldown(): void {
    const cooldownStr = localStorage.getItem('resetPasswordCooldown');
    if (cooldownStr) {
      const cooldownUntil = parseInt(cooldownStr, 10);
      const now = new Date().getTime();
      if (cooldownUntil > now) {
        this.cooldownTimeRemaining = Math.ceil((cooldownUntil - now) / 1000);
        this.startCooldownTimer();
      } else {
        localStorage.removeItem('resetPasswordCooldown');
      }
    }
  }

  private startCooldownTimer(): void {
    this.cooldownInterval = setInterval(() => {
      this.cooldownTimeRemaining--;
      if (this.cooldownTimeRemaining <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldownTimeRemaining = 0;
        localStorage.removeItem('resetPasswordCooldown');
      }
    }, 1000);
  }

  public onSubmit(): void {
    if (this.cooldownTimeRemaining > 0) return;
    this.resetFormGroup.markAllAsTouched();

    if (this.resetFormGroup.invalid) return;

    const email = this.resetFormGroup.get('email')?.value;

    this.confirmationService.confirm({
      message: `We will send a password reset link to <strong>${email}</strong>. Please ensure you have access to this inbox.`,
      header: 'Confirm Email Address',
      icon: 'pi pi-envelope text-4xl text-primary-500 mb-3',
      acceptLabel: 'Send Link',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-primary p-button-rounded px-4',
      rejectButtonStyleClass: 'p-button-outlined p-button-rounded px-4',
      accept: () => {
        this.isLoading = true;
        this.authService.ResetPassword(this.resetFormGroup.value).subscribe({
          next: (res: any) => this.handleResetPasswordSuccess(res),
          error: (e: HttpErrorResponse) => this.handleResetPasswordError(e),
        });
      }
    });
  }

  public backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private handleResetPasswordSuccess(res: any): void {
    this.isEmailSent = true;
    this.isLoading = false;
    
    const cooldownUntil = new Date().getTime() + 60000;
    localStorage.setItem('resetPasswordCooldown', cooldownUntil.toString());
    this.checkCooldown();

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password reset link has been sent to your email',
    });
  }

  private handleResetPasswordError(error: HttpErrorResponse): void {
    console.error('Reset password error', error);
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.error?.type || 'Please contact Technical Support for account recovery',
    });
  }
}
