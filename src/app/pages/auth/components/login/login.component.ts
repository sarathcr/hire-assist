import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputPasswordComponent } from '../../../../shared/components/form/input-password/input-password.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { RolesEnum } from '../../../../shared/enums/enum';
import { TokenData } from '../../../../shared/models/token-data.models';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import {
  getTokenPayloadData,
  TokenField,
} from '../../../../shared/utilities/token.utility';
import { LoginData } from '../../models/login-data.models';
import { AuthService } from '../../services/auth.service';
import { CollectionService } from '../../../../shared/services/collection.service';

@Component({
  selector: 'app-login',
  imports: [
    InputTextComponent,
    ButtonComponent,
    ReactiveFormsModule,
    Toast,
    InputPasswordComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public fGroup!: FormGroup;
  public isLoading = false;
  public configMap!: ConfigMap;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly collectionService: CollectionService,
    private readonly messageService: MessageService,
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

  public forgotPassword(): void {
    this.router.navigate(['forgot-password']);
  }

  private handleLoginSuccess(res: TokenData): void {
    if (res) {
      const userRole = getTokenPayloadData(res.accessToken, TokenField.Role);

      this.navigateToUserDashboard(userRole);
      this.collectionService.getCollection();
    }
  }

  private handleLoginError(error: HttpErrorResponse): void {
    console.error('Login error', error);
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `${error.error.type}`,
    });
  }

  private navigateToUserDashboard(userRole: number[]): void {
    const routes: Record<number, string> = {
      [RolesEnum.SuperAdmin]: '/admin/dashboard',
      [RolesEnum.Admin]: '/admin/dashboard',
      [RolesEnum.Interviewer]: '/interviewer',
      [RolesEnum.Candidate]: '/candidate',
      [RolesEnum.Coordinator]: '/coordinator',
      [RolesEnum.FrontDesk]: '/frontdesk',
    };

    const priority: RolesEnum[] = [
      RolesEnum.SuperAdmin, // 1st choice
      RolesEnum.Admin,
      RolesEnum.Interviewer,
      RolesEnum.FrontDesk,
      RolesEnum.Coordinator,
      RolesEnum.Candidate,
    ];

    const matchedRole = priority.find((r) => userRole.includes(r));

    if (matchedRole) this.router.navigateByUrl(routes[matchedRole]);
  }
}
