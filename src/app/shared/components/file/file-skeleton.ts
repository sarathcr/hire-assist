import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-file-skeleton',
  imports: [SkeletonModule],
  template: `<div class="file-dialog">
    <span class="file-dialog__body">
      <p-skeleton width="15rem" height="15rem" />
    </span>
  </div>`,
  styleUrl: './file.component.scss',
})
export class FileSkeletonComponent {}
