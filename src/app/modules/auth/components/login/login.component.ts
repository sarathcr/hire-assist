import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import { LoginData } from '../../models/loginDataModel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [InputTextComponent, ButtonComponent, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public fGroup!: FormGroup;
  public loginData = new LoginData();
  public configMap!: ConfigMap;

  constructor(private router: Router) {
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
      this.router.navigate(['/candidate']);
    }
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new LoginData();
    this.configMap = metadata.configMap || {};
  }
}
