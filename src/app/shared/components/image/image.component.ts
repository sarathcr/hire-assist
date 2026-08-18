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
import { HttpClient } from '@angular/common/http';
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

  private _width: string = '100%';
  private _height: string = '100%';

  @Input()
  set width(val: string | number) {
    this._width = this.formatSize(val);
  }
  get width(): string {
    return this._width;
  }

  @Input()
  set height(val: string | number) {
    this._height = this.formatSize(val);
  }
  get height(): string {
    return this._height;
  }

  private formatSize(val: string | number): string {
    if (!val) return '100%';
    const str = String(val).trim();
    if (/^\d+$/.test(str)) {
      return `${str}px`;
    }
    return str;
  }

  public description = 'image';
  public blobURL = '';
  public loaded = false;

  private cancelRequestSubject = new Subject<void>();

  @ViewChild(Image) imageComponent!: Image;
  constructor(private api: ApiService<any>, private http: HttpClient) {}
  ngOnInit() {
    this.loadImage();
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

    if (changes['imageUrl'] && !changes['imageUrl'].firstChange) {
      this.loaded = false;
      this.loadImage();
    }
  }

  private loadImage(): void {
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

    if (this.imageUrl.includes('files?')) {
      const url = `${endpoint}&redirect=false`;
      this.http.get<{ url: string }>(url)
        .pipe(takeUntil(this.cancelRequestSubject))
        .subscribe({
          next: (res) => {
            this.blobURL = res.url;
            this.loaded = true;
          },
          error: () => {
            this.loaded = true;
          }
        });
      return;
    }

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
  onCloseClick() {
    this.closeImage.emit();
  }
}
