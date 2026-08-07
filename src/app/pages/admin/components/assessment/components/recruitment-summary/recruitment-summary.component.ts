import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { finalize } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TooltipModule } from 'primeng/tooltip';
import { FileDto } from '../../../../models/interviewer.model';
import { ImageComponent } from '../../../../../../shared/components/image/image.component';
import { SafePipe } from '../../../../../../shared/pipes/safepipe';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { AssessmentService } from '../../../../services/assessment.service';
import { MessageService } from 'primeng/api';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-recruitment-summary',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AccordionModule,
    SkeletonModule,
    DialogModule,
    TooltipModule,
    ImageComponent,
    SafePipe,
    ButtonComponent,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './recruitment-summary.component.html',
  styleUrl: './recruitment-summary.component.scss',
})
export class RecruitmentSummaryComponent implements OnInit, OnDestroy {
  public assessmentId!: number;
  public isLoading = false;
  public isExporting = false;
  public summaryData: any = null;

  public activeAccordionIds: string[] = [];

  public showPdfModal = false;
  public safePdfUrl: SafeResourceUrl | null = null;
  public pdfUrlString: string | null = null;
  public showImageModal = false;
  public selectedImageUrl: string | null = null;

  // File Viewer & Attachment State
  public reportImages: Record<string, string> = {};
  public imageLoadingStates: Record<string, boolean> = {};
  public displayFileViewer = false;
  public fileViewerUrl: SafeResourceUrl | null = null;
  public rawFileViewerUrl: string | null = null;
  public fileViewerTitle = '';
  public isFileViewerPdf = false;
  public isFileViewerImage = false;
  public currentViewingFile: FileDto | null = null;

  // Fallback ID Proofs State
  public fallbackIdProofs: Record<string, any[]> = {};
  public isFallbackLoading: Record<string, boolean> = {};

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private interviewService: InterviewService,
    private sanitizer: DomSanitizer,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.assessmentId = +params['id'];
        this.fetchSummaryData();
      }
    });
  }

  ngOnDestroy(): void {
    Object.values(this.reportImages).forEach((url) => URL.revokeObjectURL(url));
    if (this.pdfUrlString) {
      URL.revokeObjectURL(this.pdfUrlString);
    }
  }

  private fetchSummaryData(): void {
    this.isLoading = true;
    this.interviewService
      .getSelectedStatus(this.assessmentId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.summaryData = this.sortFeedbackCriteria(data);
          this.expandAllAccordions();
          this.preloadWorksheetAttachments();
          this.loadFallbackIdProofs();
        },
        error: (error) => {
          console.error('Error fetching recruitment summary:', error);
        },
      });
  }

  private preloadWorksheetAttachments(): void {
    if (this.summaryData?.detailedCandidates) {
      this.summaryData.detailedCandidates.forEach((candidate: any) => {
        if (candidate.roundsData) {
          candidate.roundsData.forEach((round: any) => {
            const attachments = this.getRoundAttachments(round);
            attachments.forEach((file: FileDto) => {
              this.fetchFileBlob(file);
            });
          });
        }

        // Preload candidate profile/ID documents
        const profileDocs = this.getCandidateProfileDocs(candidate);
        profileDocs.forEach((file: FileDto) => {
          this.fetchFileBlob(file);
        });
      });
    }
  }

  private loadFallbackIdProofs(): void {
    if (this.summaryData?.detailedCandidates) {
      this.summaryData.detailedCandidates.forEach((candidate: any) => {
        const candidateId = candidate.id;
        if (candidateId) {
          this.isFallbackLoading[candidateId] = true;
          this.assessmentService.getIdProofsByCandidateId(candidateId).subscribe({
            next: (res: any) => {
              const proofs = res || [];
              this.fallbackIdProofs[candidateId] = proofs;
              this.isFallbackLoading[candidateId] = false;
              
              // Preload file blobs for fallback proofs
              proofs.forEach((item: any) => {
                const typeNum = item.attachmentType || 
                                item.AttachmentType || 
                                item.attachmentTypeId || 
                                item.AttachmentTypeId || 
                                this.getAttachmentTypeFromLabel(item.type || item.Type);
                const file: FileDto = {
                  name: item.name || item.Name,
                  url: item.url || item.Url || item.path || item.Path,
                  attachmentName: item.name || item.Name,
                  attachmentType: typeNum
                };
                this.fetchFileBlob(file);
              });
            },
            error: () => {
              this.isFallbackLoading[candidateId] = false;
            }
          });
        }
      });
    }
  }

  public getAttachmentTypeFromLabel(label: string | undefined): number {
    if (!label) return 6; // Default to Document
    const cleanLabel = label.trim().toLowerCase();
    if (cleanLabel.includes('resume')) return 1;
    if (cleanLabel.includes('cover image')) return 2;
    if (cleanLabel.includes('profile image')) return 3;
    if (cleanLabel.includes('aadhaar') || cleanLabel.includes('adhar') || cleanLabel.includes('id card')) return 4;
    if (cleanLabel.includes('pan')) return 5;
    if (cleanLabel.includes('document')) return 6;
    return 6;
  }

  public getAttachmentTypeLabel(type: number | undefined): string {
    if (!type) return 'Document';
    switch (type) {
      case 1: return 'Resume';
      case 2: return 'Cover Image';
      case 3: return 'Profile Image';
      case 4: return 'Aadhaar Card';
      case 5: return 'PAN Card';
      case 6: return 'Document';
      default: return 'Document';
    }
  }

  public getCandidateProfileDocs(candidate: any): any[] {
    if (!candidate) return [];
    
    let attachments = candidate.frontdeskattachments ||
                      candidate.frontdeskattachment ||
                      candidate.frontdeskAttachment || 
                      candidate.frontDeskAttachment || 
                      candidate.frontdeskAttachments || 
                      candidate.frontDeskAttachments ||
                      candidate.frontdesk_attachment ||
                      candidate.frontDesk_attachment ||
                      candidate.frontdeskAttachmentDto ||
                      candidate.frontDeskAttachmentDto ||
                      candidate.frontdeskAttachmentDtos ||
                      candidate.frontDeskAttachmentDtos ||
                      candidate.frontdeskFiles ||
                      candidate.frontDeskFiles ||
                      candidate.idProofs ||
                      candidate.idProof ||
                      candidate.candidateIdProofs ||
                      candidate.candidateIdProof ||
                      candidate.attachment ||
                      candidate.attachments;
                      
    // Fallback: If not found on candidate, look up dynamically loaded proofs
    if (!attachments && candidate.id && this.fallbackIdProofs[candidate.id]) {
      attachments = this.fallbackIdProofs[candidate.id];
    }
                      
    if (!attachments) return [];
    
    if (typeof attachments === 'object' && attachments !== null && !Array.isArray(attachments)) {
      attachments = attachments.attachment || 
                    attachments.attachments || 
                    attachments.fileDto || 
                    attachments.files || 
                    attachments;
    }

    if (typeof attachments === 'string') {
      try {
        attachments = JSON.parse(attachments);
      } catch (e) {
        console.error('Failed to parse frontdeskAttachment JSON string:', e);
        return [];
      }
    }
    
    if (typeof attachments === 'object' && attachments !== null && !Array.isArray(attachments)) {
      attachments = attachments.attachment || 
                    attachments.attachments || 
                    attachments.fileDto || 
                    attachments.files || 
                    attachments;
    }
    
    if (!attachments) return [];
    
    if (!Array.isArray(attachments)) {
      attachments = [attachments];
    }

    return attachments.map((item: any) => {
      const name = item.name || item.Name || item.attachmentName || 'ID Document';
      const url = item.url || item.Url || item.path || item.Path || '';
      const rawType = item.attachmentType || 
                      item.AttachmentType || 
                      item.attachmentTypeId || 
                      item.AttachmentTypeId;
      const typeLabel = item.type || 
                        item.Type || 
                        item.attachmentName || 
                        this.getAttachmentTypeLabel(rawType) || 
                        'Document';
      const typeVal = rawType || this.getAttachmentTypeFromLabel(item.type || item.Type || typeLabel);
      return {
        name: name,
        url: url,
        attachmentName: name,
        attachmentType: typeVal,
        idTypeLabel: typeLabel
      };
    });
  }

  public getRoundAttachments(round: any): FileDto[] {
    if (!round) return [];
    return round.fileDto || round.attachments || round.worksheetAttachments || round.files || [];
  }

  public getImageId(file: FileDto): string {
    if (!file) return '';
    const fileAny = file as any;
    if (file.id) return file.id;
    if (fileAny.Id) return fileAny.Id;
    if (file.blobId) return file.blobId;
    if (fileAny.BlobId) return fileAny.BlobId;
    if (file.url || file.path || fileAny.Url || fileAny.Path) {
      const url = file.url || file.path || fileAny.Url || fileAny.Path || '';
      return url.split('/').pop() || '';
    }
    return '';
  }

  public isImage(filename: string): boolean {
    if (!filename) return false;
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
  }

  public fetchFileBlob(file: FileDto): void {
    const id = this.getImageId(file);
    if (!id || this.reportImages[id] || this.imageLoadingStates[id]) return;

    this.imageLoadingStates[id] = true;
    const blobId = id.includes('/') ? id.split('/').pop()! : id;
    const fileAny = file as any;
    const type = file.attachmentType || fileAny.AttachmentType || fileAny.attachmentTypeId || fileAny.AttachmentTypeId || 9;

    this.interviewService.GetFiles({ blobId: blobId, attachmentType: type }).subscribe({
      next: (blob: Blob) => {
        let mimeType = blob.type;
        const filename = blobId.toLowerCase();
        
        if (filename.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filename.endsWith('.gif')) {
          mimeType = 'image/gif';
        } else if (filename.endsWith('.bmp')) {
          mimeType = 'image/bmp';
        } else if (filename.endsWith('.webp')) {
          mimeType = 'image/webp';
        }

        const safeBlob = new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(safeBlob);
        
        this.reportImages[id] = url;
        this.imageLoadingStates[id] = false;
        this.reportImages = { ...this.reportImages };
      },
      error: () => {
        this.imageLoadingStates[id] = false;
      },
    });
  }

  public viewAttachment(file: FileDto): void {
    const key = this.getImageId(file);
    if (key && this.imageLoadingStates[key]) return; // Prevent preview while file is loading
    
    this.currentViewingFile = file;
    const blobUrl = this.reportImages[key];
    const filename = file.name || key || '';
    
    if (blobUrl) {
      const isImg = this.isImage(filename);
      const isPdf = filename.toLowerCase().endsWith('.pdf');
      
      if (isImg) {
        this.selectedImageUrl = blobUrl;
        this.showImageModal = true;
      } else if (isPdf) {
        this.fileViewerTitle = file.attachmentName || filename;
        this.isFileViewerImage = false;
        this.isFileViewerPdf = true;
        this.rawFileViewerUrl = blobUrl;
        this.fileViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.displayFileViewer = true;
      }
      return;
    }

    // Fallback if blob is not pre-fetched yet
    const type = file.attachmentType || 9;
    if (key) {
      this.fetchFileBlob(file);
      const isImg = this.isImage(filename);
      const isPdf = filename.toLowerCase().endsWith('.pdf');
      
      if (isImg) {
        this.selectedImageUrl = '';
        this.showImageModal = true;
        const checkInterval = setInterval(() => {
          if (this.reportImages[key]) {
            this.selectedImageUrl = this.reportImages[key];
            clearInterval(checkInterval);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
      } else if (isPdf) {
        this.fileViewerTitle = file.attachmentName || filename;
        this.isFileViewerImage = false;
        this.isFileViewerPdf = true;
        this.displayFileViewer = true;
        this.fileViewerUrl = null; // Clear to trigger loading state
        this.rawFileViewerUrl = null;
        
        const checkInterval = setInterval(() => {
          if (this.reportImages[key]) {
            this.rawFileViewerUrl = this.reportImages[key];
            this.fileViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.reportImages[key]);
            clearInterval(checkInterval);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }
  }

  public downloadFile(): void {
    if (!this.currentViewingFile) return;

    const key = this.getImageId(this.currentViewingFile);
    const blobUrl = this.reportImages[key];
    const filename = this.currentViewingFile.name || key || 'download';

    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private sortFeedbackCriteria(data: any): any {
    console.log('=== RECRUITMENT SUMMARY RESPONSE DATA ===', data);
    if (data?.detailedCandidates) {
      data.detailedCandidates.forEach((candidate: any) => {
        console.log('=== Candidate Data ===', {
          id: candidate.id,
          name: candidate.name,
          keys: Object.keys(candidate),
          frontdeskAttachment: candidate.frontdeskAttachment,
          frontDeskAttachment: candidate.frontDeskAttachment,
          frontdeskAttachments: candidate.frontdeskAttachments,
          frontDeskAttachments: candidate.frontDeskAttachments
        });
        if (candidate.roundsData) {
          candidate.roundsData.forEach((round: any) => {
            if (round.feedbackCriteria && round.feedbackCriteria.length > 0) {
              round.feedbackCriteria.sort((a: any, b: any) => {
                const idA = Number(a.feedbackCriteriaId || a.id);
                const idB = Number(b.feedbackCriteriaId || b.id);

                if (!isNaN(idA) && !isNaN(idB)) {
                  return idA - idB;
                }

                // Fallback to alphabetical sorting by name if IDs are missing
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
              });
            }
          });
        }
      });
    }
    return data;
  }

  private expandAllAccordions(): void {
    if (this.summaryData?.detailedCandidates) {
      this.activeAccordionIds = this.summaryData.detailedCandidates.map(
        (c: any) => c.id,
      );
    }
  }

  public get isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public downloadPdf(): void {
    if (this.pdfUrlString) {
      const link = document.createElement('a');
      link.href = this.pdfUrlString;
      link.download = `Audit_Report_${this.summaryData?.recruitmentName || 'Summary'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  public exportPdf(): void {
    this.isExporting = true;
    this.interviewService
      .exportRecruitmentSummaryPdf(this.assessmentId)
      .pipe(finalize(() => (this.isExporting = false)))
      .subscribe({
        next: (blob) => {
          const safeBlob = new Blob([blob], { type: 'application/pdf' });
          if (this.pdfUrlString) {
            URL.revokeObjectURL(this.pdfUrlString);
          }
          this.pdfUrlString = URL.createObjectURL(safeBlob);
          this.showPdfModal = true;
        },
        error: (error) => {
          console.error('Error exporting PDF:', error);
        },
      });
  }

  public printSummary(): void {
    this.exportPdf();
  }

  public goBack(): void {
    this.location.back();
  }

  public getRoundTotalScore(
    round: any,
  ): { score: number; maxScore: number } | null {
    if (!round) return null;

    const hasTotalScore =
      round.totalScore !== undefined &&
      round.totalScore !== null &&
      !isNaN(Number(round.totalScore));
    const hasOutofScore =
      round.outofScore !== undefined &&
      round.outofScore !== null &&
      !isNaN(Number(round.outofScore)) &&
      Number(round.outofScore) > 0;

    if (hasTotalScore && hasOutofScore) {
      return {
        score: Number(round.totalScore),
        maxScore: Number(round.outofScore),
      };
    }

    if (round.isAptitude) {
      let score = 0;
      let maxScore = 0;
      if (round.aptitudeQuestions && round.aptitudeQuestions.length > 0) {
        const firstQuestionMarks = Number(
          round.aptitudeQuestions[0].marks || 0,
        );
        maxScore = (round.totalQuestions || 0) * firstQuestionMarks;

        round.aptitudeQuestions.forEach((q: any) => {
          if (q.isCorrect) {
            score += Number(q.marks || 0);
          }
        });
      } else {
        score = round.correctCount || 0;
        maxScore = round.totalQuestions || 0;
      }
      return { score, maxScore };
    }

    if (round.feedbackCriteria && round.feedbackCriteria.length > 0) {
      const interviewerScores: Record<
        string,
        { score: number; maxScore: number }
      > = {};

      round.feedbackCriteria.forEach((crit: any) => {
        const interviewer = crit.interviewerName || 'default';
        if (!interviewerScores[interviewer]) {
          interviewerScores[interviewer] = { score: 0, maxScore: 0 };
        }
        interviewerScores[interviewer].score += Number(crit.score || 0);
        interviewerScores[interviewer].maxScore += Number(crit.maxScore || 0);
      });

      const interviewers = Object.keys(interviewerScores);
      if (interviewers.length === 0) return { score: 0, maxScore: 0 };

      let totalScoreSum = 0;
      let totalMaxScoreSum = 0;

      interviewers.forEach((interviewer) => {
        totalScoreSum += interviewerScores[interviewer].score;
        totalMaxScoreSum += interviewerScores[interviewer].maxScore;
      });

      const averageScore =
        Math.round((totalScoreSum / interviewers.length) * 100) / 100;
      const averageMaxScore =
        Math.round((totalMaxScoreSum / interviewers.length) * 100) / 100;

      return {
        score: averageScore,
        maxScore: averageMaxScore,
      };
    }

    return null;
  }

  public maskAadhaar(id: string): string {
    if (!id) return 'N/A';
    const str = id.toString();
    if (str.length < 4) return str;
    return 'XXXX XXXX ' + str.slice(-4);
  }

  public onRemarksClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      this.selectedImageUrl = img.src;
      this.showImageModal = true;
    }
  }
}
