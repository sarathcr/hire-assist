/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgIf, NgStyle } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Image, ImageModule } from 'primeng/image';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BASE_IMAGE_URL } from '../../constants/api';
import { ApiService } from '../../services/api.service';
import { ImageSkeletonComponent } from './image-skeleton';
@Component({
  selector: 'app-image',
  standalone: true,
  imports: [NgIf, NgStyle, ImageModule, ImageSkeletonComponent],
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
})
export class ImageComponent implements OnInit, OnChanges {
  @Input() imageUrl!: string | null;
  @Input() paddingTop!: string;
  @Input() forceCancelRequest: string[] = [];
  @Input() isZoomable!: boolean;
  @Input() removeIcon = false;
  @Output() closeImage = new EventEmitter<void>();

  public description = 'image';
  public blobURL = '';
  public loaded = false;

  private cancelRequestSubject = new Subject<void>();

  @ViewChild(Image) imageComponent!: Image;
  constructor(private api: ApiService<any>) {}
  ngOnInit() {
    if (!this.imageUrl || this.imageUrl == '') {
      this.loaded = true;
      return;
    }
    if (this.imageUrl.startsWith('blob:') || this.imageUrl.startsWith('http')) {
      this.blobURL = this.imageUrl;
      this.loaded = true;
      return;
    }

    const endpoint = `${BASE_IMAGE_URL}/${this.imageUrl}`;
    this.api
      .getBlob(endpoint)
      .pipe(takeUntil(this.cancelRequestSubject))
      .subscribe({
        next: (res: Blob) => {
          this.blobURL = URL.createObjectURL(res);
          this.loaded = true;
        },
        error: () => {
          this.loaded = true;
        },
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const cancelRequest = changes['forceCancelRequest'];
    if (
      cancelRequest &&
      cancelRequest.currentValue &&
      !cancelRequest.firstChange
    ) {
      this.cancelRequestSubject.next();
    }
  }
  onCloseClick() {
    this.closeImage.emit();
  }
}
