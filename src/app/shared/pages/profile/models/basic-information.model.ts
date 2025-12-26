import { Metadata } from '../../../utilities/form.utility';

export class BasicInformation {
  name = '';
  email = '';
  phone = '';
  dob: Date | undefined;
  gender = '';
  memberSince: Date | undefined;
  metadata: Metadata = {
    validatorsMap: {},
    configMap: {
      name: { id: 'name', labelKey: 'Name', readonly: true },
      email: { id: 'email', labelKey: 'Email', readonly: true },
      phone: { id: 'phone', labelKey: 'Phone', readonly: true },
      dob: { id: 'dob', labelKey: 'Date of Birth', readonly: true },
      gender: { id: 'gender', labelKey: 'Gender', readonly: true },
      memberSince: {
        id: 'memberSince',
        labelKey: 'Member Since',
        readonly: true,
      },
    },
  };
}
export interface ProfileDetails {
  name: string;
  email: string;
  phoneNumber: string;
  dob: Date;
  gender: string;
  createdAt: Date;
  designation: string;
  coverPhoto?: GetImageResponseDto;
  profilePhoto?: GetImageResponseDto;
  userSkills?: SkillsDto[];
  userUpcomingInterviews?: UpcomingInterviewDto[];
}

export interface UpcomingInterviewDto {
  scheduleAt: Date | null;
}

export interface SkillsDto {
  id: number;
  name: string;
}

export interface GetImageResponseDto {
  id: string;
  name: string;
  path: string;
  url: string;
  attachmentType: number;
  attachmentName: string;
}
