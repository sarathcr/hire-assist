import { Component, OnDestroy, OnInit, DoCheck } from '@angular/core';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { ButtonComponent } from '../../../../components/button/button.component';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../components/base/base.component';
import { Metadata } from '../../../../utilities/form.utility';
import { ProfileFormGroup } from '../../models/profile.model';
import { ImageModule } from 'primeng/image';
import { FileUpload, FileSelectEvent } from 'primeng/fileupload';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-dialog',
  imports: [InputTextComponent, ButtonComponent, ImageModule, FileUpload, SkeletonModule, CommonModule],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss',
})
export class ProfileDialogComponent
  extends BaseComponent
  implements OnInit, OnDestroy, DoCheck
{
  public data!: ProfileFormGroup & { onProfileImageUpload?: (file: File) => void; isLoadingProfileImage?: boolean };
  public metadata!: Metadata[];
  public isEdit = false;
  public isLoadingProfileImage = false;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data;
    console.log(this.data);
    this.isEdit = !!this.data.formData?.id;
    this.isLoadingProfileImage = this.data.isLoadingProfileImage || false;
    if (this.isEdit) {
      const formData = this.data.formData;
      formData.id = this.data.formData.id;
      this.data.fGroup.patchValue({ ...formData });
    }
  }
  
  ngDoCheck(): void {
    // Update loading state when parent updates it
    if (this.data.isLoadingProfileImage !== undefined) {
      this.isLoadingProfileImage = this.data.isLoadingProfileImage;
    }
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  //Public Methods
  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref.close(this.data.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }

  public onProfileImageSelected(event: FileSelectEvent): void {
    const files = event.currentFiles;
    if (files.length && this.data.onProfileImageUpload) {
      this.isLoadingProfileImage = true;
      this.data.onProfileImageUpload(files[0]);
    }
  }
}
