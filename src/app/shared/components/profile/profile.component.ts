import { Component, OnInit } from '@angular/core';
import { InputTextComponent } from '../form/Input-Text-Components/input-text/input-text.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { buildFormGroup, ConfigMap } from '../../utilities/form.utility';
import { Profile } from '../../models/profile-models';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { InputTextCalenderComponent } from '../form/Input-Text-Components/input-text-calender/input-text-calender.component';
import { InputTextIftalabelComponent } from '../form/Input-Text-Components/input-text-iftalabel/input-text-iftalabel.component';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';


@Component({
  selector: 'app-profile',
  imports: [ ButtonComponent,ReactiveFormsModule,InputTextCalenderComponent,InputTextIftalabelComponent, Toast],
  providers:[MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  
})
export class ProfileComponent implements OnInit {
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public profile = new Profile();
  profileImage: string ='default_profile.jpg';
  imageAlt: string = 'image'; 


    constructor(private router: Router, private messageService: MessageService) {
      this.fGroup = buildFormGroup(this.profile);
    }
  
    ngOnInit(): void {
      this.setConfigMaps();
    }

    public async onSave() {
      this.fGroup.markAllAsTouched();
      const isFormValid = this.fGroup.valid;
      if (isFormValid) {
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile saved successfully',
      });
    } else {
      // Optional: Show an error message
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please complete the required fields',
      });
    }
      }

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result; 
      };
      reader.readAsDataURL(file); 
    }
  }

 private setConfigMaps(): void {
    const { metadata } = new Profile();
    this.configMap = metadata.configMap || {};
  }
  
  
}
