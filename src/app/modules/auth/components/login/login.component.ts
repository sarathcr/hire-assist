import { Component } from '@angular/core';
import { InputTextComponent } from "../../../../shared/components/form/input-text/input-text.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";

@Component({
  selector: 'app-login',
  imports: [InputTextComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
