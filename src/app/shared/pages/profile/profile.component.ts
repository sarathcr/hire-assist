import { UpperCasePipe, DatePipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent } from '../../components/base/base.component';
import { AttachmentTypeEnum } from '../../enums/status.enum';
import { FileRequest } from '../../models/files.models';
import { buildFormGroup, ConfigMap } from '../../utilities/form.utility';
import { StoreService } from '../../services/store.service';
import { BasicInformationComponent } from './components/basic-information/basic-information.component';
import { CoverImageComponent } from './components/cover-image/cover-image.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { SkillsDialogComponent, SkillsDialogData } from './components/skills-dialog/skills-dialog.component';
import { PersonalDetailsDialogComponent } from './components/personal-details-dialog/personal-details-dialog.component';
import { ExperienceDialogComponent } from './components/experience-dialog/experience-dialog.component';
import { ProfileDetails, SkillsDto, ExperienceDto } from './models/basic-information.model';
import { Profile, ProfileForm } from './models/profile.model';
import { ProfileServicesService } from './services/profile-services.service';
import { ProfileSkeletonComponent } from './profile-skeleton.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    BasicInformationComponent,
    CoverImageComponent,
    ButtonModule,
    ProfileSkeletonComponent,
    SkeletonModule,
    TooltipModule,
    TimelineModule,
    UpperCasePipe,
    DatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent extends BaseComponent implements OnInit {
  public circles = Array.from({ length: 15 });
  public profileBlob: string | undefined;
  public coverBlob: string | undefined;
  public profileType: number | undefined;
  public coverType: number | undefined;
  public profileDetailsDataSource!: ProfileDetails;
  public profileDataSource!: Profile;
  public profileImageUrl!: string;
  public coverImageUrl!: string;
  private ref: DynamicDialogRef | undefined;
  public configMap!: ConfigMap;
  public ProfileFormData = new ProfileForm();
  public fGroup!: FormGroup;
  public isLoading = true;
  public isLoadingCoverImage = false;
  public isLoadingProfileImage = false;
  public isAddingSkill = false;
  public experienceTimeline: any[] = [];
  public userRole: string = '';

  constructor(
    private readonly profileServices: ProfileServicesService,
    public messageService: MessageService,
    public dialog: DialogService,
    private readonly storeService: StoreService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.ProfileFormData);
  }
  ngOnInit(): void {
    this.getProfileDetails();
    this.setConfigMaps();
    this.loadUserRole();
  }

  private loadUserRole(): void {
    const roles = this.storeService.getUserRole();
    if (roles && roles.length > 0) {
      // Capitalize first letter of each role word
      this.userRole = roles
        .map(r => r.replace(/([a-z])([A-Z])/g, '$1 $2'))
        .map(r => r.charAt(0).toUpperCase() + r.slice(1))
        .join(', ');
    }
  }

  private readonly MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

  private isValidImage(file: File): boolean {
    // 1. Type validation
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: 'Only JPG and PNG images are allowed.',
      });
      return false;
    }

    // 2. Size validation
    if (file.size > this.MAX_IMAGE_SIZE_BYTES) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Image size must not exceed 2 MB.',
      });
      return false;
    }

    return true;
  }

  /** Called from the avatar's hidden file input */
  public onProfileImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.isValidImage(file)) {
      input.value = '';
      return;
    }

    this.onProfileImageUpload(file);
    input.value = '';
  }

  public onCoverImageUpload(file: File): void {
    if (!this.isValidImage(file)) {
      return;
    }

    this.isLoadingCoverImage = true;
    const payload: FileRequest = {
      attachmentType: AttachmentTypeEnum.CoverImage,
      file: file,
    };
    this.profileServices.uploadFiles(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Cover photo updated successfully',
        });
        this.getProfileDetails();
      },
      error: () => {
        this.isLoadingCoverImage = false;
      },
    });
  }

  public onEditPersonalDetails(): void {
    const ref = this.dialog.open(PersonalDetailsDialogComponent, {
      data: {
        userDetails: this.profileDetailsDataSource,
      },
      header: 'Update Personal Details',
      width: '600px',
      modal: true,
      breakpoints: {
        '640px': '90vw',
      },
    });

    ref.onClose.subscribe((data) => {
      if (data) {
        const payload = {
          name: this.profileDetailsDataSource?.name || '',
          email: data.email,
          phoneNumber: data.phone,
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : null,
          gender: data.gender,
          designation: '',
        };
        
        this.profileServices.updatePersonalDetails(payload).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Personal details updated successfully',
            });
            this.getProfileDetails();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update personal details',
            });
          },
        });
      }
    });
  }


  public onProfileImageUpload(file: File): void {
    this.isLoadingProfileImage = true;
    if (this.ref) {
      const dialogData = (this.ref as any).config?.data;
      if (dialogData) {
        dialogData.isLoadingProfileImage = true;
      }
    }
    
    const payload: FileRequest = {
      attachmentType: AttachmentTypeEnum.ProfileImage,
      file: file,
    };
    this.profileServices.uploadFiles(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile image uploaded successfully',
        });
        this.getProfileDetails();
        if (this.ref) {
          const dialogData = (this.ref as any).config?.data;
          if (dialogData) {
            dialogData.isLoadingProfileImage = false;
          }
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload profile image',
        });
        this.isLoadingProfileImage = false;
        if (this.ref) {
          const dialogData = (this.ref as any).config?.data;
          if (dialogData) {
            dialogData.isLoadingProfileImage = false;
          }
        }
      },
    });
  }

  public onDeleteCoverImage(): void {
    if (!this.coverBlob) {
      return;
    }
    this.profileServices
      .DeleteImage(this.coverBlob, AttachmentTypeEnum.CoverImage)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully',
          });
          this.coverImageUrl = '';
        },
        error: () => {
          // Error handling
        },
      });
  }

  public onEditSkills(): void {
    const data: SkillsDialogData = {
      availableSkills: [],
      userSkills: this.profileDetailsDataSource?.userSkills || [],
      onSave: (skills: SkillsDto[]) => this.onSaveSkills(skills),
    };
    this.ref = this.dialog.open(SkillsDialogComponent, {
      data: data,
      header: 'Edit Skills',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      contentStyle: { overflow: 'visible', padding: '0' },
    });
    this.ref?.onClose.subscribe(() => {
      // Handle dialog close
    });
  }

  private onSaveSkills(skills: SkillsDto[]): void {
    this.profileServices.postUserSkills(skills).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skills updated successfully',
        });
        this.getProfileDetails();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update skills',
        });
      },
    });
  }

  public onDeleteSkill(skillId: number): void {
    this.profileServices.deleteUserSkill(skillId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill removed successfully',
        });
        this.getProfileDetails();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove skill',
        });
      },
    });
  }

  private getProfileDetails(): void {
    if (this.storeService.isProfileDetailsLoading) {
      setTimeout(() => {
        if (!this.storeService.isProfileDetailsLoading) {
          this.loadProfileDetails();
        } else {
          setTimeout(() => this.loadProfileDetails(), 200);
        }
      }, 100);
      return;
    }

    this.loadProfileDetails();
  }

  private loadProfileDetails(): void {
    this.isLoading = true;
    this.storeService.setIsProfileDetailsLoading(true);
    
    const next = (res: ProfileDetails) => {
      this.profileDetailsDataSource = res;
      
      // Map experiences to timeline
      if (res.userExperiences) {
        this.experienceTimeline = res.userExperiences.map((exp: any) => ({
          id: exp.id,
          status: exp.role,
          company: exp.company,
          date: this.formatDateRange(exp.startDate, exp.endDate, exp.isCurrent),
          icon: 'pi pi-briefcase',
          color: exp.isCurrent ? '#4f46e5' : '#64748b',
          description: exp.description
        }));
      }

      this.coverBlob = res.coverPhoto?.id;
      this.coverType = res.coverPhoto?.attachmentType;
      this.profileBlob = res.profilePhoto?.id;
      this.profileType = res.profilePhoto?.attachmentType;
      this.profileDataSource = { ...this.profileDataSource, id: res.email };
      if (res.designation != undefined)
        this.profileDataSource.designation = res.designation;

      if (this.profileBlob != undefined && this.profileType != undefined)
        this.getProfilePhoto(this.profileBlob, this.profileType);
      if (this.coverBlob != undefined && this.coverType != undefined)
        this.getCoverPhoto(this.coverBlob, this.coverType);
      
      this.isLoading = false;
      this.storeService.setIsProfileDetailsLoading(false);
    };
    const error = () => {
      this.isLoading = false;
      this.storeService.setIsProfileDetailsLoading(false);
    };
    this.profileServices.GetProfileDetails().subscribe({ next, error });
  }
  private getProfilePhoto(blob: string, attachmentType: number): void {
    this.isLoadingProfileImage = true;
    if (this.ref) {
      const dialogData = (this.ref as any).config?.data;
      if (dialogData) {
        dialogData.isLoadingProfileImage = true;
      }
    }
    
    this.profileServices.GetPhoto(blob, attachmentType).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        this.profileImageUrl = url;
        if (url != undefined) {
          this.profileDataSource.profileUrl = url;
          this.storeService.setProfileImageUrl(url);
        }
        this.isLoadingProfileImage = false;
        if (this.ref) {
          const dialogData = (this.ref as any).config?.data;
          if (dialogData) {
            dialogData.isLoadingProfileImage = false;
          }
        }
      },
      error: () => {
        this.isLoadingProfileImage = false;
        if (this.ref) {
          const dialogData = (this.ref as any).config?.data;
          if (dialogData) {
            dialogData.isLoadingProfileImage = false;
          }
        }
      },
    });
  }
  private getCoverPhoto(blob: string, attachmentType: number): void {
    this.isLoadingCoverImage = true;
    this.profileServices.GetPhoto(blob, attachmentType).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        this.coverImageUrl = url;
        this.isLoadingCoverImage = false;
      },
      error: () => {
        this.isLoadingCoverImage = false;
      },
    });
  }

  private setConfigMaps(): void {
    const { metadata } = new ProfileForm();
    this.configMap = metadata.configMap || {};
  }

  private formatDateRange(start: string | Date, end: string | Date | null | undefined, isCurrent: boolean): string {
    const datePipe = new DatePipe('en-US');
    const startStr = datePipe.transform(start, 'MMM yyyy') || '';
    if (isCurrent) {
      return `${startStr} - Present`;
    }
    const endStr = end ? datePipe.transform(end, 'MMM yyyy') || '' : '';
    return `${startStr} - ${endStr}`;
  }

  public onAddExperience(): void {
    this.ref = this.dialog.open(ExperienceDialogComponent, {
      header: 'Add Experience',
      width: '550px',
      modal: true,
      contentStyle: { overflow: 'visible', padding: '0' }
    });

    this.ref.onClose.subscribe((experience: ExperienceDto) => {
      if (experience) {
        this.onSaveExperience(experience);
      }
    });
  }

  public onEditExperience(id: number): void {
    const experience = this.profileDetailsDataSource.userExperiences?.find(e => e.id === id);
    if (!experience) return;

    this.ref = this.dialog.open(ExperienceDialogComponent, {
      header: 'Edit Experience',
      width: '550px',
      data: { experience },
      modal: true,
      contentStyle: { overflow: 'visible', padding: '0' }
    });

    this.ref.onClose.subscribe((updatedExp: ExperienceDto) => {
      if (updatedExp) {
        this.onSaveExperience(updatedExp);
      }
    });
  }

  private onSaveExperience(experience: ExperienceDto): void {
    const experiences = [...(this.profileDetailsDataSource.userExperiences || [])];
    
    if (experience.id) {
      const index = experiences.findIndex(e => e.id === experience.id);
      if (index > -1) experiences[index] = experience;
    } else {
      experiences.push(experience);
    }

    this.profileServices.saveUserExperiences(experiences).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Experience updated' });
        this.loadProfileDetails();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save experience' });
      }
    });
  }

  public onDeleteExperience(id: number): void {
    this.profileServices.deleteUserExperience(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Experience removed' });
        this.loadProfileDetails();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove experience' });
      }
    });
  }
}
