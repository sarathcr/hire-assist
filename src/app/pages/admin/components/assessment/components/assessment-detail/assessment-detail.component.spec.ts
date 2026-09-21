import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentDetailComponent } from './assessment-detail.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DropdownManagerService } from '../../../../../../shared/services/dropdown-manager.service';
import { AssessmentRound } from '../../../../models/assessment.model';

describe('AssessmentDetailComponent', () => {
  let component: AssessmentDetailComponent;
  let fixture: ComponentFixture<AssessmentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (_key: string) => null,
              },
            },
          },
        },
        MessageService,
        ConfirmationService,
        DialogService,
        DropdownManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Round Type Evaluation (isAptitudeRound & isPanelRound)', () => {
    it('should correctly identify Online Aptitude Test by roundTypeId = 1', () => {
      const round: AssessmentRound = {
        id: 101,
        roundId: 1,
        round: 'Technical Round',
        roundTypeId: 1,
        status: 'Active',
        statusId: 1,
        sequence: 1,
        isActive: true,
      };
      expect(component.isAptitudeRound(round)).toBeTrue();
      expect(component.isPanelRound(round)).toBeFalse();
    });

    it('should correctly identify Online Aptitude Test when roundTypeId is string "1"', () => {
      const round: any = {
        id: 102,
        roundId: 2,
        round: 'Technical Interview',
        roundTypeId: '1',
        status: 'Active',
        sequence: 1,
      };
      expect(component.isAptitudeRound(round)).toBeTrue();
      expect(component.isPanelRound(round)).toBeFalse();
    });

    it('should correctly identify Offline Panel Interview by roundTypeId = 2', () => {
      const round: AssessmentRound = {
        id: 103,
        roundId: 3,
        round: 'Technical Round',
        roundTypeId: 2,
        status: 'Active',
        statusId: 1,
        sequence: 2,
        isActive: true,
      };
      expect(component.isAptitudeRound(round)).toBeFalse();
      expect(component.isPanelRound(round)).toBeTrue();
    });

    it('should correctly identify Offline Panel Interview when roundTypeId is string "2"', () => {
      const round: any = {
        id: 104,
        roundId: 4,
        round: 'Interview Round',
        roundTypeId: '2',
        status: 'Active',
        sequence: 2,
      };
      expect(component.isAptitudeRound(round)).toBeFalse();
      expect(component.isPanelRound(round)).toBeTrue();
    });

    it('should not mark round as panel if roundTypeId is 1 even if round name contains "interview" or "panel"', () => {
      const round: any = {
        id: 105,
        roundId: 5,
        round: 'Technical Panel Interview',
        roundTypeId: 1,
        status: 'Active',
        sequence: 1,
      };
      expect(component.isAptitudeRound(round)).toBeTrue();
      expect(component.isPanelRound(round)).toBeFalse();
    });

    it('should fallback to name check when roundTypeId is missing or 0', () => {
      const aptitudeRound: any = {
        id: 106,
        roundId: 6,
        round: 'Online Aptitude Test',
        status: 'Active',
        sequence: 1,
      };
      expect(component.isAptitudeRound(aptitudeRound)).toBeTrue();
      expect(component.isPanelRound(aptitudeRound)).toBeFalse();

      const panelRound: any = {
        id: 107,
        roundId: 7,
        round: 'Technical Interview',
        status: 'Active',
        sequence: 2,
      };
      expect(component.isAptitudeRound(panelRound)).toBeFalse();
      expect(component.isPanelRound(panelRound)).toBeTrue();
    });

    it('should update table columns and action guide for aptitude round without panel column', () => {
      const round: any = {
        id: 108,
        roundId: 8,
        round: 'Technical Round',
        roundTypeId: 1,
        status: 'Active',
        sequence: 1,
      };
      component.step = [round];
      spyOn<any>(component, 'getPaginatedCandidateData').and.stub();

      component.setActiveMenuItem(0, 108, 'Active');

      const columnFields = component.columns.columns.map((c: any) => c.field);
      expect(columnFields).toContain('batch');
      expect(columnFields).toContain('questionSet');
      expect(columnFields).not.toContain('panel');
      expect(component.selectedGuideTab).toBe('aptitude');
    });

    it('should update table columns and action guide for panel interview with panel column and without batch/questionSet', () => {
      const round: any = {
        id: 109,
        roundId: 9,
        round: 'Technical Round',
        roundTypeId: 2,
        status: 'Active',
        sequence: 2,
      };
      component.step = [round];
      spyOn<any>(component, 'getPaginatedCandidateData').and.stub();

      component.setActiveMenuItem(0, 109, 'Active');

      const columnFields = component.columns.columns.map((c: any) => c.field);
      expect(columnFields).toContain('panel');
      expect(columnFields).not.toContain('batch');
      expect(columnFields).not.toContain('questionSet');
      expect(component.selectedGuideTab).toBe('interview');
    });
  });
});
