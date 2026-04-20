import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CarouselModule } from 'primeng/carousel';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextComponent,
    ButtonComponent,
    CarouselModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  public resetFormGroup: FormGroup;
  public isLoading = false;
  public isEmailSent = false;
  public configMap!: ConfigMap;
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
      next: (res: any) => this.handleResetPasswordSuccess(res),
      error: (e: HttpErrorResponse) => this.handleResetPasswordError(e),
    });
  }

  public backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private handleResetPasswordSuccess(res: any): void {
    this.isEmailSent = true;
    this.isLoading = false;
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
