import { Component, HostListener, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { QuestionService } from '../../../pages/admin/services/question.service';
import { ImageComponent } from '../image/image.component';
import { FileSkeletonComponent } from './file-skeleton';

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  standalone: true,
  imports: [ImageComponent, FileSkeletonComponent],
})
export class FileComponent implements OnInit {
  public forceCancelRequest: string[] = [];
  public imageUrl: string | null = null;
  public isLoading = true;
  get data() {
    return this.config.data;
  }

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    public questionService: QuestionService,
  ) {}
  ngOnInit() {
    this.fetchImage();
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
    const { blobId, attachmentType } = this.data;

    this.questionService.GetFiles({ blobId, attachmentType }).subscribe({
      next: (blob: Blob) => {
        this.imageUrl = URL.createObjectURL(blob);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Failed to load image');
      },
    });
  }
}
