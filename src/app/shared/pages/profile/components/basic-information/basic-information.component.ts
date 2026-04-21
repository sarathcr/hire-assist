import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, input } from '@angular/core';
import {
  BasicInformation,
  ProfileDetails,
  UpcomingInterviewDto,
} from '../../models/basic-information.model';

@Component({
  selector: 'app-basic-information',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './basic-information.component.html',
  styleUrl: './basic-information.component.scss',
})
export class BasicInformationComponent {
  public basicInformationForm = new BasicInformation();
  public upcomingInterviews: UpcomingInterviewDto[] = [];
  userDetails = input<ProfileDetails>();

  constructor() {
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
        this.upcomingInterviews = (user?.userUpcomingInterviews || []).map(
          (i: UpcomingInterviewDto) => ({
            scheduleAt: i.scheduleAt ? new Date(i.scheduleAt) : null,
          }),
        );
      }
    });
  }
}
