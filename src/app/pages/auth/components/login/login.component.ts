import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../services/auth.service';
import { LoginData } from '../../models/login-data.models';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import {
  getTokenPayloadData,
  TokenField,
} from '../../../../shared/utilities/token.utility';
import { TokenData } from '../../../../shared/models/token-data.models';
import { RolesEnum } from '../../../../shared/enums/enum';
import { InputPasswordComponent } from "../../../../shared/components/form/input-password/input-password.component";

@Component({
  selector: 'app-login',
  imports: [InputTextComponent, ButtonComponent, ReactiveFormsModule, Toast, InputPasswordComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public fGroup!: FormGroup;
  public isLoading = false;
  public configMap!: ConfigMap;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
  ) {
    this.fGroup = buildFormGroup(new LoginData());
  }

  ngOnInit(): void {
    this.configMap = new LoginData().metadata.configMap || {};
  }

  public async onSave(): Promise<void> {
    this.fGroup.markAllAsTouched();
    if (!this.fGroup.valid) return;

    this.isLoading = true;
    this.authService.login(this.fGroup.value).subscribe({
      next: (res: TokenData) => this.handleLoginSuccess(res),
      error: (e: HttpErrorResponse) => this.handleLoginError(e),
    });
  }

  private handleLoginSuccess(res: TokenData): void {
    if (res) {
      const userRole = getTokenPayloadData(res.accessToken, TokenField.Role);
      this.navigateToUserDashboard(userRole);
    }
    this.isLoading = false;
  }

  private handleLoginError(error: HttpErrorResponse): void {
    console.error('Login error', error);
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Invalid username or password',
    });
  }

  private navigateToUserDashboard(userRole: number[]): void {
    const routes: Record<number, string> = {
      [RolesEnum.Admin]: '/admin/dashboard',
      [RolesEnum.Interviewer]: '/interviewer',
      [RolesEnum.Candidate]: '/candidate',
    };

    const route = userRole.find((role) => routes[role]);
    if (route) this.router.navigateByUrl(routes[route]);
  }
}
