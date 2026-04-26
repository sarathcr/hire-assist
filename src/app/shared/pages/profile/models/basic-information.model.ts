import { FormEntity, Metadata } from '../../../utilities/form.utility';

export class BasicInformation extends FormEntity {
  name = '';
  email = '';
  phone = '';
  dob: Date | undefined;
  gender = '';
  memberSince: Date | undefined;
  metadata: Metadata = {
    validatorsMap: {},
    configMap: {
      name: { id: 'name', labelKey: 'Name' },
      email: { id: 'email', labelKey: 'Email' },
      phone: { id: 'phone', labelKey: 'Phone' },
      dob: { id: 'dob', labelKey: 'Date of Birth' },
      gender: {
        id: 'gender',
        labelKey: 'Gender',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'others', label: 'Others' },
        ],
      },
      memberSince: {
        id: 'memberSince',
        labelKey: 'Member Since',
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
  userExperiences?: ExperienceDto[];
}

export interface ExperienceDto {
  id: number;
  company: string;
  role: string;
  startDate: string | Date;
  endDate?: string | Date;
  description?: string;
  isCurrent: boolean;
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
