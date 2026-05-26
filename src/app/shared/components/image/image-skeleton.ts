import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-image-skeleton',
  imports: [SkeletonModule],
  template: `<p-skeleton width="100%" height="100%" borderRadius="4px" />`,
  host: {
    style: 'display: block; width: 100%; height: 100%;'
  }
})
export class ImageSkeletonComponent {}

