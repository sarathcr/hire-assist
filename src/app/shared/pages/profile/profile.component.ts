import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TabsModule } from 'primeng/tabs';
import { Toast } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent } from '../../components/base/base.component';
import { AttachmentTypeEnum } from '../../enums/status.enum';
import { ErrorResponse } from '../../models/custom-error.models';
import { FileRequest } from '../../models/files.models';
import { buildFormGroup, ConfigMap } from '../../utilities/form.utility';
import { StoreService } from '../../services/store.service';
import { BasicInformationComponent } from './components/basic-information/basic-information.component';
import { CoverImageComponent } from './components/cover-image/cover-image.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { SkillsDialogComponent, SkillsDialogData } from './components/skills-dialog/skills-dialog.component';
import { ProfileDetails, SkillsDto } from './models/basic-information.model';
import { Profile, ProfileForm } from './models/profile.model';
import { ProfileServicesService } from './services/profile-services.service';
import { ProfileSkeletonComponent } from './profile-skeleton.component';

@Component({
  selector: 'app-profile',
  imports: [
    TabsModule,
    BasicInformationComponent,
    CoverImageComponent,
    ButtonModule,
    Toast,
    ProfileSkeletonComponent,
    SkeletonModule,
    TooltipModule,
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
  }
  public onCoverImageUpload(file: File): void {
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
          detail: 'File uploaded successfully',
        });
        this.getProfileDetails();
      },
      error: (error) => {
        this.isLoadingCoverImage = false;
      },
    });
  }

  public onEdit() {
    if (this.profileDataSource) {
      const data = {
        fGroup: this.fGroup,
        configMap: this.configMap,
        formData: this.profileDataSource,
        onProfileImageUpload: (file: File) => this.onProfileImageUpload(file),
        isLoadingProfileImage: this.isLoadingProfileImage,
      };
      this.ref = this.dialog.open(ProfileDialogComponent, {
        data: data,
        header: 'Edit Profile',
        width: '50vw',
        modal: true,
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw',
        },
      });
    }
    this.ref?.onClose.subscribe((res) => {
      if (res) {
        // Handle dialog close response if needed
      }
      this.fGroup.reset();
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
}
