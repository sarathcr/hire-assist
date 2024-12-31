import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../shared/utilities/form.utility';
import { LoginData } from '../../models/loginDataModel';

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

  constructor() {
    this.fGroup = buildFormGroup(this.loginData);
  }

  ngOnInit(): void {
    this.setConfigMaps();
  }

  // Public
  public async onSave() {
    console.log('==>', this.fGroup.value);
  }

  // Private
  private setConfigMaps(): void {
    const { metadata } = new LoginData();
    this.configMap = metadata.configMap || {};
  }
}
