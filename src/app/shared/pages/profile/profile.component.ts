import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TabsModule } from 'primeng/tabs';
import { Toast } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { BaseComponent } from '../../components/base/base.component';
import { AttachmentTypeEnum } from '../../enums/status.enum';
import { ErrorResponse } from '../../models/custom-error.models';
import { FileRequest } from '../../models/files.models';
import { buildFormGroup, ConfigMap } from '../../utilities/form.utility';
import { BasicInformationComponent } from './components/basic-information/basic-information.component';
import { CoverImageComponent } from './components/cover-image/cover-image.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { ProfileDetails } from './models/basic-information.model';
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
  ) {
    super();
    this.fGroup = buildFormGroup(this.ProfileFormData);
  }
  // LifeCycle Hooks
  ngOnInit(): void {
    this.getProfileDetails();
    this.setConfigMaps();
  }
  // Public methods
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
        console.error('Error uploading file:', error);
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
        // this.updatePanel(res);
        console.log(res);
      }
      this.fGroup.reset();
    });
  }

  public onProfileImageUpload(file: File): void {
    this.isLoadingProfileImage = true;
    // Update dialog's loading state if it's open
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
      },
      error: (error) => {
        console.error('Error uploading profile image:', error);
        this.isLoadingProfileImage = false;
        // Update the dialog's loading state if it's open
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
      console.warn('No cover image to delete');
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
        error: (error) => {
          console.error('Failed to delete file:', error);
        },
      });
  }

  // Private Methods
  private getProfileDetails(): void {
    this.isLoading = true;
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
    };
    const error = (error: ErrorResponse) => {
      console.log('ERROR', error);
      this.isLoading = false;
    };
    this.profileServices.GetProfileDetails().subscribe({ next, error });
  }
  private getProfilePhoto(blob: string, attachmentType: number): void {
    this.isLoadingProfileImage = true;
    // Update dialog's loading state if it's open
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
        if (url != undefined) this.profileDataSource.profileUrl = url;
        this.isLoadingProfileImage = false;
        // Update dialog's loading state if it's open
        if (this.ref) {
          const dialogData = (this.ref as any).config?.data;
          if (dialogData) {
            dialogData.isLoadingProfileImage = false;
          }
        }
      },
      error: (error: ErrorResponse) => {
        console.log('ERROR', error);
        this.isLoadingProfileImage = false;
        // Update dialog's loading state if it's open
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
      error: (error: ErrorResponse) => {
        console.log('ERROR', error);
        this.isLoadingCoverImage = false;
      },
    });
  }

  private setConfigMaps(): void {
    const { metadata } = new ProfileForm();
    this.configMap = metadata.configMap || {};
  }
}
