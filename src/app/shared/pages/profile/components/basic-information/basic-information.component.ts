import { CommonModule, DatePipe } from '@angular/common';
import { Component, effect, input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../components/button/button.component';
import { InputTextCalenderComponent } from '../../../../components/form/input-text-calender/input-text-calender.component';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { buildFormGroup, ConfigMap } from '../../../../utilities/form.utility';
import {
  BasicInformation,
  ProfileDetails,
  UpcomingInterviewDto,
} from '../../models/basic-information.model';

@Component({
  selector: 'app-basic-information',
  imports: [
    ReactiveFormsModule,
    InputTextComponent,
    InputTextCalenderComponent,
    ButtonComponent,
    DatePipe,
    CommonModule,
  ],
  templateUrl: './basic-information.component.html',
  styleUrl: './basic-information.component.scss',
})
export class BasicInformationComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public editStatus = true;
  public basicInformationForm = new BasicInformation();
  public upcomingInterviews: UpcomingInterviewDto[] = [];
  userDetails = input<ProfileDetails>();

  constructor() {
    this.fGroup = buildFormGroup(this.basicInformationForm);
    effect(() => {
      const user = this.userDetails();
      if (user) {
        this.basicInformationForm.name = user?.name || '';
        this.basicInformationForm.email = user?.email || '';
        this.basicInformationForm.phone = user?.phoneNumber || '';
        this.basicInformationForm.gender = user?.gender || '';
        this.basicInformationForm.dob = user?.dob
          ? new Date(user.dob)
          : undefined;
        this.basicInformationForm.memberSince = user?.createdAt
          ? new Date(user.createdAt)
          : undefined;
        this.fGroup.patchValue(this.basicInformationForm);
        this.upcomingInterviews = (user?.userUpcomingInterviews || []).map(
          (i: UpcomingInterviewDto) => ({
            scheduleAt: i.scheduleAt ? new Date(i.scheduleAt) : null,
          }),
        );
      }
    });
  }

  // Lifecycle hooks
  ngOnInit(): void {
    this.setConfigMap();
  }

  //Public Methods
  public onEdit() {
    Object.keys(this.configMap).forEach((key) => {
      this.configMap[key].readonly = false;
    });
  }

  // Private methods
  private setConfigMap() {
    const { metadata } = new BasicInformation();
    this.configMap = metadata.configMap || {};
  }
}
