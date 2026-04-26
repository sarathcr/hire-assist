import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { finalize } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-recruitment-summary',
  standalone: true,
  imports: [CommonModule, ButtonModule, AccordionModule, SkeletonModule, DialogModule],
  templateUrl: './recruitment-summary.component.html',
  styleUrl: './recruitment-summary.component.scss'
})
export class RecruitmentSummaryComponent implements OnInit {

  public assessmentId!: number;
  public isLoading = false;
  public isExporting = false;
  public summaryData: any = null;

  public activeAccordionIds: string[] = [];
  
  public showPdfModal = false;
  public safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private interviewService: InterviewService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.assessmentId = +params['id'];
        this.fetchSummaryData();
      }
    });
  }

  private fetchSummaryData(): void {
    this.isLoading = true;
    this.interviewService.getSelectedStatus(this.assessmentId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.summaryData = data;
          this.expandAllAccordions();
        },
        error: (error) => {
          console.error('Error fetching recruitment summary:', error);
        }
      });
  }

  private expandAllAccordions(): void {
    if (this.summaryData?.detailedCandidates) {
      this.activeAccordionIds = this.summaryData.detailedCandidates.map((c: any) => c.id);
    }
  }

  public printSummary(): void {
    if (this.isExporting) return;

    this.isExporting = true;
    
    this.interviewService.exportRecruitmentSummaryPdf(this.assessmentId)
      .pipe(finalize(() => this.isExporting = false))
      .subscribe({
        next: (blob) => {
          const blobURL = URL.createObjectURL(blob);
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobURL);
          this.showPdfModal = true;
        },
        error: (error) => {
          console.error('Error exporting audit report:', error);
        }
      });
  }

  public goBack(): void {
    this.location.back();
  }

  public maskAadhaar(id: string): string {
    if (!id) return 'N/A';
    const str = id.toString();
    if (str.length < 4) return str;
    return 'XXXX XXXX ' + str.slice(-4);
  }
}
