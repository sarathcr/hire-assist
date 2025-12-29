import { Component, OnDestroy, OnInit, DoCheck, ChangeDetectorRef } from '@angular/core';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { ButtonComponent } from '../../../../components/button/button.component';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../../../components/base/base.component';
import { Metadata } from '../../../../utilities/form.utility';
import { ProfileFormGroup } from '../../models/profile.model';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-dialog',
  imports: [
    InputTextComponent,
    ButtonComponent,
    ImageModule,
    ButtonModule,
    SkeletonModule,
    CommonModule,
    ReactiveFormsModule,
  ],
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
  public selectedFile: File | null = null;
  public previewImageUrl: string | null = null;
  public displayImageUrl: string = '';
  private objectUrl: string | null = null;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = !!this.data.formData?.id;
    this.isLoadingProfileImage = this.data.isLoadingProfileImage || false;
    this.updateDisplayImageUrl();
    if (this.isEdit) {
      const formData = this.data.formData;
      formData.id = this.data.formData.id;
      this.data.fGroup.patchValue({ ...formData });
    }
  }
  
  ngDoCheck(): void {
    if (this.data.isLoadingProfileImage !== undefined) {
      const wasLoading = this.isLoadingProfileImage;
      this.isLoadingProfileImage = this.data.isLoadingProfileImage;
      
      if (wasLoading && !this.isLoadingProfileImage && this.selectedFile) {
        if (this.isEdit && this.ref) {
          this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
        } else {
          this.ref.close(this.data.fGroup.value);
        }
      }
    }
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    
    if (this.selectedFile && this.data.onProfileImageUpload) {
      this.isLoadingProfileImage = true;
      this.data.onProfileImageUpload(this.selectedFile);
      return;
    }
    
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref.close(this.data.fGroup.value);
    }
  }

  public onClose() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.ref.close();
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      if (file.size > 1000000) {
        return;
      }
      
      this.selectedFile = file;
      
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
      }
      
      this.objectUrl = URL.createObjectURL(file);
      this.previewImageUrl = this.objectUrl;
      this.updateDisplayImageUrl();
      this.cdr.detectChanges();
      input.value = '';
    }
  }

  private updateDisplayImageUrl(): void {
    this.displayImageUrl = this.previewImageUrl || this.data.formData?.profileUrl || 'avatar.png';
  }
}
