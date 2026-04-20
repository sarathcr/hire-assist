import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CarouselModule } from 'primeng/carousel';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputPasswordComponent } from '../../../../shared/components/form/input-password/input-password.component';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import { ResetPasswordChangeData } from '../../models/change-password-data.model';
import { AuthService } from '../../services/auth.service';

interface Slide {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-reset-password-change',
  imports: [
    InputPasswordComponent,
    ButtonComponent,
    CommonModule,
    ReactiveFormsModule,
    CarouselModule,
  ],
  templateUrl: './reset-password-change.component.html',
  styleUrl: './reset-password-change.component.scss',
})
export class ResetPasswordChangeComponent implements OnInit {
  public resetPasswordFormGroup: FormGroup;
  public isLoading = false;
  public configMap!: ConfigMap;
  public token: string | null = '';
  public id: string | null = '';
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
    private readonly route: ActivatedRoute,
  ) {
    this.resetPasswordFormGroup = buildFormGroup(new ResetPasswordChangeData());
  }

  ngOnInit(): void {
    this.configMap = new ResetPasswordChangeData().metadata.configMap || {};
  }

  public onSubmit(): void {
    this.resetPasswordFormGroup.markAllAsTouched();
    const formValue = this.resetPasswordFormGroup.value;

    if (this.resetPasswordFormGroup.invalid) return;

    this.isLoading = true;

    if (formValue.newPassword !== formValue.confirmPassword) {
      this.handlePasswordMatchError();
    } else {
      this.route.queryParams.subscribe((params) => {
        this.token = params['token'] || '';
        this.id = params['id'] || '';
      });

      if (this.token === '' || this.id === '') {
        this.handleInvalidTokenOrIdError();
      }

      const payload = { token: this.token, id: this.id, ...formValue };
      this.authService.ResetPasswordChange(payload).subscribe({
        next: (res: boolean) => this.handleResetPasswordSuccess(res),
        error: (e: HttpErrorResponse) => this.handleResetPasswordError(e),
      });
    }
  }

  public backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private handleResetPasswordSuccess(res: boolean): void {
    if (res) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Successfully changed your password',
      });
    }
    this.isLoading = false;
  }

  private handleResetPasswordError(error: CustomErrorResponse): void {
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.error?.type || 'Contact Technical Support',
    });
  }

  private handlePasswordMatchError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Passwords must match',
    });
    this.isLoading = false;
  }

  private handleInvalidTokenOrIdError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Invalid token or ID',
    });
    this.isLoading = false;
  }
}
