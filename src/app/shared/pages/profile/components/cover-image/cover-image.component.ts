import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-cover-image',
  imports: [ButtonModule, SkeletonModule],
  templateUrl: './cover-image.component.html',
  styleUrl: './cover-image.component.scss',
})
export class CoverImageComponent {
  coverUrl = input<string>();
  isLoading = input<boolean>(false);
  public coverImageUrl!: string | ArrayBuffer | null;
  // 'https://images.pexels.com/photos/10003878/pexels-photo-10003878.jpeg';
  public coverImage = output<File>();
  public deleteCover = output<void>();

  // Public methods
  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.coverImage.emit(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverImageUrl = e.target?.result ?? '';
      };
      reader.readAsDataURL(file);
    }
  }

  public onEditCoverImage(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  public onImageError(): void {
    this.coverImageUrl = '';
  }

  public onButtonKeyDown(
    event: KeyboardEvent,
    fileInput: HTMLInputElement,
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onEditCoverImage(fileInput);
    }
  }

  public onDeleteButtonKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onDeleteCoverImage();
    }
  }

  onDeleteCoverImage(): void {
    this.deleteCover.emit();
  }
}
