import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { finalize } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-recruitment-summary',
  standalone: true,
  imports: [CommonModule, ButtonModule, AccordionModule, SkeletonModule],
  templateUrl: './recruitment-summary.component.html',
  styleUrl: './recruitment-summary.component.scss'
})
export class RecruitmentSummaryComponent implements OnInit {

  public assessmentId!: number;
  public isLoading = false;
  public summaryData: any = null;

  public activeAccordionIds: string[] = [];

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private interviewService: InterviewService
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
    // Ensure all accordions are expanded before capturing
    this.expandAllAccordions();
    
    // Delay to let Angular/PrimeNG DOM updates apply fully before capturing DOM
    setTimeout(() => {
      const data = document.querySelector('.printable-area') as HTMLElement;
      if (!data) return;

      html2canvas(data, { scale: 2, useCORS: true }).then(canvas => {
        // Calculate dimensions to match exact aspect ratio in a continuous single-page PDF
        const pdfWidth = 210; // standard A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const contentDataURL = canvas.toDataURL('image/png', 1.0);
        
        // Create PDF exactly the size of the content so there are no awkward page breaks cutting text
        const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]); 
        
        pdf.addImage(contentDataURL, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${this.summaryData.recruitmentName.replace(/\s+/g, '_')}_Audit_Report.pdf`);
      });
    }, 500); // 500ms allows animations/accordions adequate time to complete opening
  }

  public goBack(): void {
    this.location.back();
  }
}
