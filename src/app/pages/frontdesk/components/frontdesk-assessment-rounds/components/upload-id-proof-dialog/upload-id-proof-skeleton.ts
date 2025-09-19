import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-upload-id-proof-skeleton',
  imports: [SkeletonModule],
  template: `<div class="proofUpload__preview">
    <span class="__proofUpload__preview__img">
      <p-skeleton width="15rem" height="15rem" />
    </span>
  </div>`,
  styleUrls: ['./upload-id-proof-dialog.component.scss'],
})
export class UploadIdProofSkeletonComponent {}
