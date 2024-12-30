import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { LoginData } from '../../models/loginDataModel';
import { buildFormGroup } from '../../../../shared/utilities/form.utility';

@Component({
  selector: 'app-login',
  imports: [InputTextComponent, ButtonComponent, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  public fGroup!: FormGroup;
  public loginData = new LoginData();

  constructor() {
    this.fGroup = buildFormGroup(this.loginData);
  }
}
