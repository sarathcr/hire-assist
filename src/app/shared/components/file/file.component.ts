import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { QuestionService } from '../../../pages/admin/services/question.service';
import { ImageComponent } from '../image/image.component';
import { FileSkeletonComponent } from './file-skeleton';

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  standalone: true,
  imports: [ImageComponent, FileSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileComponent implements OnInit, OnDestroy {
  public forceCancelRequest: string[] = [];
  public imageUrl: string | null = null;
  public isLoading = true;
  public hasError = false;

  private isDestroyed = false;
  private preloadImg: HTMLImageElement | null = null;
  private safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  get data() {
    return this.config.data;
  }

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    public questionService: QuestionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fetchImage();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.safetyTimeoutId) {
      clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }
    if (this.preloadImg) {
      this.preloadImg.onload = null;
      this.preloadImg.onerror = null;
      this.preloadImg = null;
    }
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  // EVENTS

  public onClose() {
    this.forceCancelRequest = [];
    setTimeout(() => {
      this.ref.close();
    }, 0);
  }

  private fetchImage() {
    const { blobId, attachmentType } = this.data || {};

    if (!blobId) {
      this.isLoading = false;
      this.hasError = true;
      this.cdr.markForCheck();
      return;
    }

    const startTime = Date.now();
    const MIN_LOADING_TIME = 500;

    const finishLoading = (url: string | null, isError = false) => {
      if (this.isDestroyed) return;
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        if (this.isDestroyed) return;
        if (this.safetyTimeoutId) {
          clearTimeout(this.safetyTimeoutId);
          this.safetyTimeoutId = null;
        }
        if (isError || !url) {
          this.hasError = true;
        } else {
          this.imageUrl = url;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      }, delay);
    };

    this.questionService.GetFilesUrl({ blobId, attachmentType }).subscribe({
      next: (res) => {
        if (this.isDestroyed) return;

        if (res?.url) {
          const url = res.url;
          if (typeof window === 'undefined') {
            finishLoading(url, false);
            return;
          }

          const img = new window.Image();
          this.preloadImg = img;

          img.onload = () => finishLoading(url, false);
          img.onerror = () => finishLoading(url, true);

          // Safety timeout (10s) in case image download hangs
          this.safetyTimeoutId = setTimeout(() => {
            finishLoading(url, false);
          }, 10000);

          img.src = url;
        } else {
          finishLoading(null, true);
        }
      },
      error: () => {
        if (this.isDestroyed) return;
        finishLoading(null, true);
        console.error('Failed to load image');
      },
    });
  }
}
