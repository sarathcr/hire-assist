import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/Input-Text-Components/input-text/input-text.component';
import { RolesEnum } from '../../../../shared/enum/enum';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import {
  getTokenPayloadData,
  TokenField,
} from '../../../../shared/utilities/token.utility';
import { LoginData } from '../../models/loginDataModel';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-login',
  imports: [InputTextComponent, ButtonComponent, ReactiveFormsModule, Toast],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public fGroup!: FormGroup;
  public loginData = new LoginData();
  public configMap!: ConfigMap;
  public isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.fGroup = buildFormGroup(this.loginData);
  }

  ngOnInit(): void {
    this.setConfigMaps();
  }

  // Public
  public async onSave() {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;
    if (isFormValid) {
      const value = this.fGroup.value;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next = (res: any) => {
        if (res) {
          const userRole = getTokenPayloadData(
            res.accessToken,
            TokenField.Role
          );

          this.navigateToUserDashboard(userRole);
          this.isLoading = false;
        }
      };
      const error = (e: HttpErrorResponse) => {
        console.log('Login error', e);
        this.isLoading = false;
        // Optional: Show an error message
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid username or password',
        });
      };
      this.isLoading = true;
      this.authService.login(value).subscribe({ next, error });
    }
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new LoginData();
    this.configMap = metadata.configMap || {};
  }

  private navigateToUserDashboard(userRole: number[]): void {
    if (userRole.includes(RolesEnum.SuperAdmin || RolesEnum.Admin)) {
      this.router.navigateByUrl('/admin');
    } else if (userRole.includes(RolesEnum.Interviewer)) {
      this.router.navigateByUrl('/interviewer');
    } else if (userRole.includes(RolesEnum.Candidate)) {
      this.router.navigateByUrl('/candidate');
    }
  }

  private errorHandler(e: HttpErrorResponse) {
    let msg = '';
    switch (e.status) {
      case 0:
        msg = 'errors.connectionRefused';
        break;
      case 403:
        msg = 'errors.unauthorized';
        break;
      case 404:
        msg = 'errors.notFound';
        break;
      case 422:
        msg = 'errors.unauthorized';
        console.error('Token error: unable to parse token');
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        msg = 'validation.invalidLogin';
    }
    console.error(e);
  }
}
