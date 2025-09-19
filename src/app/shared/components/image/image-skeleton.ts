import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-image-skeleton',
  imports: [SkeletonModule],
  template: `<div class="image-container">
    <span class="image-container__loader">
      <p-skeleton width="15rem" height="15rem" />
    </span>
  </div>`,
  styleUrl: './image.component.scss',
})
export class ImageSkeletonComponent {}
