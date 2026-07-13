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
          this.summaryData = this.sortFeedbackCriteria(data);
          this.expandAllAccordions();
        },
        error: (error) => {
          console.error('Error fetching recruitment summary:', error);
        }
      });
  }

  private sortFeedbackCriteria(data: any): any {
    if (data?.detailedCandidates) {
      data.detailedCandidates.forEach((candidate: any) => {
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

  public getRoundTotalScore(round: any): { score: number; maxScore: number } | null {
    if (!round) return null;
    
    if (round.isAptitude) {
      let score = 0;
      let maxScore = 0;
      if (round.aptitudeQuestions && round.aptitudeQuestions.length > 0) {
        round.aptitudeQuestions.forEach((q: any) => {
          const marks = Number(q.marks || 0);
          maxScore += marks;
          if (q.isCorrect) {
            score += marks;
          }
        });
      } else {
        score = round.correctCount || 0;
        maxScore = round.totalQuestions || 0;
      }
      return { score, maxScore };
    }
    
    if (round.feedbackCriteria && round.feedbackCriteria.length > 0) {
      const interviewerScores: Record<string, { score: number; maxScore: number }> = {};
      
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
      
      const averageScore = Math.round((totalScoreSum / interviewers.length) * 100) / 100;
      const averageMaxScore = Math.round((totalMaxScoreSum / interviewers.length) * 100) / 100;
      
      return {
        score: averageScore,
        maxScore: averageMaxScore
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
}
