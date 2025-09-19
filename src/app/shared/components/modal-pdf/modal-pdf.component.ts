/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiService } from '../../services/api.service';
import { SafePipe } from '../../pipes/safepipe';
import { BASE_DOCUMENTS_URL } from '../../constants/api';

@Component({
  selector: 'app-modal-pdf',
  templateUrl: './modal-pdf.component.html',
  styles: `
    .modal-content {
      min-height: 550px;
      &.loader {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .preview {
        height: 10rem;
        display: flex;
        justify-content: center;
        padding: 5px;
        margin-top: 5rem;
        .pdf {
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--dark-blue);
          font-size: 5rem;
          &:hover {
            cursor: pointer;
          }
        }
      }
    }
  `,
  standalone: true,
  imports: [NgIf, SafePipe],
})
export class ModalPdfComponent implements OnInit {
  public blobURL = '';
  public loaded = false;

  private cancelRequestSubject = new Subject<void>();

  get data() {
    return this.config.data;
  }

  constructor(
    private api: ApiService<any>,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) {}

  // LIFE CYCLE
  ngOnInit(): void {
    this.renderPdf(this.data.ticketUrl);
  }

  // PUBLIC
  public onClose() {
    this.cancelRequestSubject.next();
    setTimeout(() => {
      this.ref.close();
    }, 0);
  }

  public onPdfDownload() {
    if (this.blobURL) {
      window.open(this.blobURL, '_blank');
    }
  }

  // PRIVATE
  private renderPdf(url: string) {
    const endpoint = `${BASE_DOCUMENTS_URL}/${url}`;
    const next = (res: Blob) => {
      this.loaded = true;
      const blob = new Blob([res], { type: 'application/pdf' });
      this.blobURL = URL.createObjectURL(blob);
    };
    const error = (err: HttpErrorResponse) => {
      this.loaded = true;
      this.ref.close();
      console.error('Error downloading pdf', err);
    };
    this.api
      .getBlob(endpoint)
      .pipe(takeUntil(this.cancelRequestSubject))
      .subscribe({ next, error });
  }
}
