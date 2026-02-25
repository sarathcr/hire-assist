import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { Location } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-recruitment-summary',
  standalone: true,
  imports: [CommonModule, ButtonModule, AccordionModule],
  templateUrl: './recruitment-summary.component.html',
  styleUrl: './recruitment-summary.component.scss'
})
export class RecruitmentSummaryComponent {

  public summaryData: any = {
    recruitmentName: 'Senior Software Engineer (Frontend)',
    recruitmentId: 'REQ-FE-2026-004',
    dateCreated: new Date('2026-01-15T09:00:00Z'),
    totalCandidates: 145,
    selected: 8,
    rejected: 120,
    inProgress: 17,
    status: 'In Progress',
    
    // Overall Rounds Summary
    rounds: [
      { id: 1, name: 'Initial Screening', completed: 145, passed: 65, failed: 80, status: 'Completed', interviewer: 'HR Team', cutOffScore: 60 },
      { id: 2, name: 'Aptitude Assessment', completed: 65, passed: 30, failed: 35, status: 'Completed', interviewer: 'Automated Platform', cutOffScore: 70 },
      { id: 3, name: 'Technical Interview L1', completed: 30, passed: 15, failed: 15, status: 'Completed', interviewer: 'Alice S., Bob J.', cutOffScore: 75 },
      { id: 4, name: 'Technical Interview L2', completed: 15, passed: 10, failed: 3, status: 'In Progress', interviewer: 'Charlie B.', cutOffScore: 80 },
      { id: 5, name: 'HR & Culture Match', completed: 10, passed: 8, failed: 2, status: 'Pending', interviewer: 'Diana P.', cutOffScore: 70 }
    ],

    // Detailed Candidate Audit Data
    detailedCandidates: [
      {
        id: 'CAND-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 555-0198',
        finalStatus: 'Selected',
        overallScore: 92,
        roundsData: [
          {
            roundId: 1,
            roundName: 'Initial Screening',
            status: 'Passed',
            score: 85,
            cutOffScore: 60,
            panelName: 'HR Screening Panel',
            interviewer: 'Sarah (HR)',
            overallReason: 'Strong communication, matches basic requirements perfectly.',
            feedbackCriteria: [
              { name: 'Communication', score: 9, remarks: 'Clear and concise' },
              { name: 'Experience Match', score: 8, remarks: 'Has 5+ years in React' }
            ],
            frontdeskAttachments: [{ name: 'Resume_JohnDoe.pdf', type: 'pdf', size: '1.2 MB' }],
            worksheetAttachments: []
          },
          {
            roundId: 2,
            roundName: 'Aptitude Assessment',
            status: 'Passed',
            score: 95,
            cutOffScore: 70,
            panelName: 'Auto-Evaluator Module',
            interviewer: 'Automated Platform',
            questionSet: 'Frontend Dev Aptitude Set A',
            overallReason: 'Excellent problem solving skills.',
            feedbackCriteria: [
              { name: 'Logical Reasoning', score: 10, remarks: 'Perfect score' },
              { name: 'Basic Algorithms', score: 9, remarks: 'Very fast execution' }
            ],
            frontdeskAttachments: [],
            worksheetAttachments: [{ name: 'Aptitude_Report_JD.pdf', type: 'pdf', size: '0.8 MB' }]
          },
          {
            roundId: 3,
            roundName: 'Technical Interview L1',
            status: 'Passed',
            score: 88,
            cutOffScore: 75,
            panelName: 'Frontend Experts Panel',
            interviewer: 'Alice S.',
            overallReason: 'Solid grasp of JS fundamentals and React hooks.',
            feedbackCriteria: [
              { name: 'JavaScript Core', score: 9, remarks: 'Knows closures and event loop well.' },
              { name: 'React Constructs', score: 8, remarks: 'Good custom hook implementation.' },
              { name: 'CSS/Layouts', score: 9, remarks: 'Built the flexbox layout perfectly.' }
            ],
            frontdeskAttachments: [],
            worksheetAttachments: [
              { name: 'LiveCoding_Snapshot.png', type: 'image', size: '2.4 MB' },
              { name: 'Interviewer_Notes_AS.txt', type: 'text', size: '12 KB' }
            ]
          },
          {
            roundId: 4,
            roundName: 'Technical Interview L2',
            status: 'Passed',
            score: 96,
            cutOffScore: 80,
            panelName: 'System Architecture Panel',
            interviewer: 'Charlie B.',
            overallReason: 'Exceptional architectural knowledge.',
            feedbackCriteria: [
              { name: 'System Design', score: 10, remarks: 'Designed a scalable notification system.' },
              { name: 'Performance Optimization', score: 9, remarks: 'Identified memory leaks correctly.' }
            ],
            frontdeskAttachments: [],
            worksheetAttachments: [{ name: 'Architecture_Diagram.jpg', type: 'image', size: '3.1 MB' }]
          },
          {
            roundId: 5,
            roundName: 'HR & Culture Match',
            status: 'Passed',
            score: 92,
            cutOffScore: 70,
            panelName: 'Final Culture Fit Panel',
            interviewer: 'Diana P.',
            overallReason: 'Great team player, aligns with core values.',
            feedbackCriteria: [
              { name: 'Leadership', score: 9, remarks: 'Mentored juniors previously.' },
              { name: 'Conflict Resolution', score: 9, remarks: 'Mature approach to disagreements.' }
            ],
            frontdeskAttachments: [{ name: 'Background_Check_Consent.pdf', type: 'pdf', size: '0.4 MB' }],
            worksheetAttachments: []
          }
        ]
      },
      {
        id: 'CAND-042',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 555-8821',
        finalStatus: 'Rejected',
        overallScore: 68,
        roundsData: [
          {
            roundId: 1,
            roundName: 'Initial Screening',
            status: 'Passed',
            score: 75,
            cutOffScore: 60,
            panelName: 'HR Screening Panel',
            interviewer: 'Sarah (HR)',
            overallReason: 'Good communication, sufficient experience.',
            feedbackCriteria: [
              { name: 'Communication', score: 8, remarks: 'Articulate' },
              { name: 'Experience Match', score: 7, remarks: '3 years experience, slightly lower than desired but acceptable' }
            ],
            frontdeskAttachments: [{ name: 'Resume_JaneSmith.docx', type: 'doc', size: '1.8 MB' }],
            worksheetAttachments: []
          },
          {
            roundId: 2,
            roundName: 'Aptitude Assessment',
            status: 'Passed',
            score: 72,
            cutOffScore: 70,
            panelName: 'Auto-Evaluator Module',
            interviewer: 'Automated Platform',
            questionSet: 'Frontend Dev Aptitude Set A',
            overallReason: 'Just passed the cut-off.',
            feedbackCriteria: [
              { name: 'Logical Reasoning', score: 7, remarks: 'Average' },
              { name: 'Basic Algorithms', score: 7, remarks: 'Struggled with dynamic programming' }
            ],
            frontdeskAttachments: [],
            worksheetAttachments: [{ name: 'Aptitude_Report_JS.pdf', type: 'pdf', size: '0.9 MB' }]
          },
          {
            roundId: 3,
            roundName: 'Technical Interview L1',
            status: 'Failed',
            score: 55,
            cutOffScore: 75,
            panelName: 'Frontend Experts Panel',
            interviewer: 'Bob J.',
            overallReason: 'Did not demonstrate strong foundational knowledge of React state management.',
            feedbackCriteria: [
              { name: 'JavaScript Core', score: 6, remarks: 'Okay with basics, struggled with promises.' },
              { name: 'React Constructs', score: 5, remarks: 'Could not explain useEffect lifecycle correctly.' },
              { name: 'CSS/Layouts', score: 6, remarks: 'Basic CSS knowledge only.' }
            ],
            frontdeskAttachments: [],
            worksheetAttachments: [
              { name: 'Failed_Code_Snippet.ts', type: 'code', size: '4 KB' }
            ]
          }
        ]
      }
    ]
  };

  public activeAccordionIds: string[] = [];

  constructor(private location: Location) {
    // Open all accordions by default for the audit report
    this.expandAllAccordions();
  }

  private expandAllAccordions(): void {
    this.activeAccordionIds = this.summaryData.detailedCandidates.map((c: any) => c.id);
  }

  public printSummary(): void {
    // Ensure all accordions are expanded before capturing
    this.expandAllAccordions();
    
    // Delay to let Angular/PrimeNG DOM updates apply fully before capturing DOM
    setTimeout(() => {
      const data = document.querySelector('.printable-area') as HTMLElement;
      if (!data) return;

      // Use a custom class briefly to hide things we don't want in the PDF
      // Since we had .no-print for standard printing, we can hide them manually here if needed, 
      // but html2canvas only captures what's inside .printable-area anyway.

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
