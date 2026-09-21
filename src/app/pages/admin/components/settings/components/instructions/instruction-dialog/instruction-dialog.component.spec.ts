import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InstructionDialogComponent } from './instruction-dialog.component';
import { InstructionService } from '../../../../../services/instruction.service';

describe('InstructionDialogComponent', () => {
  let component: InstructionDialogComponent;
  let fixture: ComponentFixture<InstructionDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockDialogConfig: DynamicDialogConfig;
  let mockInstructionService: jasmine.SpyObj<InstructionService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    mockDialogConfig = {
      data: {
        mode: 'create',
      },
    };
    mockInstructionService = jasmine.createSpyObj('InstructionService', [
      'getInstructions',
      'getInstructionById',
    ]);
    mockInstructionService.getInstructions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InstructionDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: DynamicDialogConfig, useValue: mockDialogConfig },
        { provide: InstructionService, useValue: mockInstructionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with valid default sections', () => {
    expect(component).toBeTruthy();
    expect(component.sections.length).toBeGreaterThan(0);
    expect(component.areSectionsValid).toBeTrue();
    expect(component.isFormValid).toBeTrue();
  });

  describe('Block Title Character Limit and Validation', () => {
    it('should be valid when block title is between 1 and 100 characters', () => {
      component.sections[0].title = 'A'.repeat(100);
      expect(component.areSectionsValid).toBeTrue();

      component.sections[0].title = 'Valid Block Title';
      expect(component.areSectionsValid).toBeTrue();
    });

    it('should be invalid when block title is empty or only whitespace', () => {
      component.sections[0].title = '';
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();

      component.sections[0].title = '   ';
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should be invalid when block title exceeds 100 characters', () => {
      component.sections[0].title = 'A'.repeat(101);
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should ensure duplicated section title is capped at 100 characters', () => {
      component.sections[0].title = 'A'.repeat(98);
      component.duplicateSection(0);
      const duplicated = component.sections[1];
      expect(duplicated.title.length).toBeLessThanOrEqual(100);
      expect(duplicated.title).toBe(`${'A'.repeat(98)} (Copy)`.slice(0, 100));
    });
  });

  describe('Rules Character Limit and Validation', () => {
    it('should be valid when rules are between 1 and 300 characters', () => {
      component.sections[0].rules = [
        'A'.repeat(300),
        'Short rule',
      ];
      expect(component.areSectionsValid).toBeTrue();
      expect(component.isFormValid).toBeTrue();
    });

    it('should be invalid when any rule exceeds 300 characters', () => {
      component.sections[0].rules = [
        'A'.repeat(301),
      ];
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should be invalid when a section has no non-empty rules', () => {
      component.sections[0].rules = ['', '   '];
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should be invalid when a valid section has any empty or whitespace rule added', () => {
      component.sections[0].rules = ['Valid rule 1', ''];
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();

      component.sections[0].rules = ['Valid rule 1', '   '];
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('Section and Rule Count Limits', () => {
    it('should not allow adding sections beyond MAX_SECTIONS (10)', () => {
      while (component.sections.length < component.MAX_SECTIONS) {
        component.addSection();
      }
      expect(component.sections.length).toBe(component.MAX_SECTIONS);

      // Attempt to add via blank section
      component.addSection();
      expect(component.sections.length).toBe(component.MAX_SECTIONS);

      // Attempt to add via preset
      component.addComponentFromPreset('support');
      expect(component.sections.length).toBe(component.MAX_SECTIONS);

      // Attempt to add via duplication
      component.duplicateSection(0);
      expect(component.sections.length).toBe(component.MAX_SECTIONS);
    });

    it('should invalidate form if sections length exceeds MAX_SECTIONS', () => {
      while (component.sections.length < component.MAX_SECTIONS) {
        component.addSection();
      }
      expect(component.areSectionsValid).toBeTrue();

      component.sections.push({
        title: 'Extra Section',
        severity: 'info',
        icon: 'pi pi-info-circle',
        rules: ['Rule 1'],
        collapsed: false,
      });

      expect(component.sections.length).toBe(11);
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });

    it('should not allow adding rules beyond MAX_RULES_PER_SECTION (10)', () => {
      while (component.sections[0].rules.length < component.MAX_RULES_PER_SECTION) {
        component.addRule(0);
      }
      expect(component.sections[0].rules.length).toBe(component.MAX_RULES_PER_SECTION);

      component.addRule(0);
      expect(component.sections[0].rules.length).toBe(component.MAX_RULES_PER_SECTION);
    });

    it('should invalidate form if rules count in any section exceeds MAX_RULES_PER_SECTION', () => {
      while (component.sections[0].rules.length < component.MAX_RULES_PER_SECTION) {
        component.addRule(0);
      }
      component.sections[0].rules = component.sections[0].rules.map((_, i) => `Rule ${i + 1}`);
      expect(component.areSectionsValid).toBeTrue();

      component.sections[0].rules.push('Extra Rule 11');
      expect(component.sections[0].rules.length).toBe(11);
      expect(component.areSectionsValid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('Saving and Payload Sanitization', () => {
    it('should prevent onSave if any rule is empty or whitespace', () => {
      component.sections = [
        {
          title: 'Valid Title',
          severity: 'danger',
          icon: 'pi pi-shield',
          rules: ['Valid Rule', ''],
          collapsed: false,
        },
      ];

      expect(component.isFormValid).toBeFalse();
      component.onSave();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should sanitize titles and trim whitespace onSave when form is valid', () => {
      component.sections = [
        {
          title: '  Trimmed Title  ',
          severity: 'danger',
          icon: 'pi pi-shield',
          rules: ['  Valid Rule  ', '  Second Rule  '],
          collapsed: false,
        },
      ];

      expect(component.isFormValid).toBeTrue();
      component.onSave();

      expect(mockDialogRef.close).toHaveBeenCalled();
      const callArg = mockDialogRef.close.calls.mostRecent().args[0];
      expect(callArg.action).toBe('create');

      const savedContent = JSON.parse(callArg.data.content);
      expect(savedContent.length).toBe(1);
      expect(savedContent[0].title).toBe('Trimmed Title');
      expect(savedContent[0].rules).toEqual(['Valid Rule', 'Second Rule']);
    });
  });

  describe('Drag and Drop Reordering', () => {
    it('should reorder sections when dropped to a different position', () => {
      component.sections = [
        { title: 'Section 1', severity: 'info', icon: 'pi pi-info', rules: ['R1'] },
        { title: 'Section 2', severity: 'warn', icon: 'pi pi-warn', rules: ['R2'] },
        { title: 'Section 3', severity: 'danger', icon: 'pi pi-danger', rules: ['R3'] },
      ];

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 2,
      } as any;

      component.onSectionDrop(dropEvent);

      expect(component.sections.length).toBe(3);
      expect(component.sections[0].title).toBe('Section 2');
      expect(component.sections[1].title).toBe('Section 3');
      expect(component.sections[2].title).toBe('Section 1');
    });

    it('should not mutate order when section is dropped at same index', () => {
      component.sections = [
        { title: 'Section 1', severity: 'info', icon: 'pi pi-info', rules: ['R1'] },
        { title: 'Section 2', severity: 'warn', icon: 'pi pi-warn', rules: ['R2'] },
      ];

      const dropEvent = {
        previousIndex: 1,
        currentIndex: 1,
      } as any;

      component.onSectionDrop(dropEvent);

      expect(component.sections[0].title).toBe('Section 1');
      expect(component.sections[1].title).toBe('Section 2');
    });

    it('should reorder rules within a section when dropped to a different position', () => {
      component.sections = [
        {
          title: 'Section 1',
          severity: 'info',
          icon: 'pi pi-info',
          rules: ['Rule Alpha', 'Rule Beta', 'Rule Gamma'],
        },
      ];

      const dropEvent = {
        previousIndex: 2,
        currentIndex: 0,
      } as any;

      component.onRuleDrop(dropEvent, 0);

      expect(component.sections[0].rules).toEqual(['Rule Gamma', 'Rule Alpha', 'Rule Beta']);
    });

    it('should not mutate rules order when rule is dropped at same index', () => {
      component.sections = [
        {
          title: 'Section 1',
          severity: 'info',
          icon: 'pi pi-info',
          rules: ['Rule Alpha', 'Rule Beta'],
        },
      ];

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 0,
      } as any;

      component.onRuleDrop(dropEvent, 0);

      expect(component.sections[0].rules).toEqual(['Rule Alpha', 'Rule Beta']);
    });

    it('should set isDragging to true and hide all tooltips onDragStart', () => {
      spyOn(component, 'hideAllTooltips');
      expect(component.isDragging).toBeFalse();

      component.onDragStart();

      expect(component.isDragging).toBeTrue();
      expect(component.hideAllTooltips).toHaveBeenCalled();
    });

    it('should hide all tooltips and reset isDragging on onDragEnd', (done) => {
      spyOn(component, 'hideAllTooltips');
      component.isDragging = true;

      component.onDragEnd();

      expect(component.hideAllTooltips).toHaveBeenCalled();
      setTimeout(() => {
        expect(component.isDragging).toBeFalse();
        done();
      }, 150);
    });

    it('should hide all tooltips on onDragHandlePointerDown', () => {
      spyOn(component, 'hideAllTooltips');

      component.onDragHandlePointerDown();

      expect(component.hideAllTooltips).toHaveBeenCalled();
    });

    it('should deactivate tooltips and remove .p-tooltip DOM elements in hideAllTooltips', () => {
      const mockTooltip = jasmine.createSpyObj('Tooltip', ['deactivate']);
      component.tooltips = {
        forEach: (cb: any) => cb(mockTooltip),
      } as any;

      const dummyTooltipEl = document.createElement('div');
      dummyTooltipEl.className = 'p-tooltip';
      document.body.appendChild(dummyTooltipEl);

      component.hideAllTooltips();

      expect(mockTooltip.deactivate).toHaveBeenCalled();
      expect(document.querySelector('.p-tooltip')).toBeNull();
    });
  });

  describe('Version Tag Handling across Modes', () => {
    it('should NOT increment version when in preview mode, even if instruction has recruitment references', () => {
      component.mode = 'preview';
      const mockInstruction = {
        id: 99,
        title: 'Aptitude Test Instructions',
        description: 'Test description',
        version: 'v1.0',
        content: JSON.stringify([
          {
            title: 'Section 1',
            severity: 'info',
            icon: 'pi pi-info',
            rules: ['Rule 1'],
          },
        ]),
        hasRecruitmentReferences: true,
        hasCompletedRecruitmentReferences: true,
      };

      (component as any).populateFromObject(mockInstruction);

      expect(component.version).toBe('v1.0');
      expect(component.originalVersion).toBe('v1.0');
      expect(component.isDuplicateTitleAndVersion).toBeFalse();
    });

    it('should compute next version from originalVersion in clone mode without double-incrementing', () => {
      component.mode = 'clone';
      component.title = 'Aptitude Test Instructions';
      component.existingInstructions = [
        { id: 1, title: 'Aptitude Test Instructions', version: 'v1.0' },
      ];
      const mockInstruction = {
        id: 1,
        title: 'Aptitude Test Instructions',
        version: 'v1.0',
        content: JSON.stringify([]),
      };

      (component as any).populateFromObject(mockInstruction);
      expect(component.version).toBe('v1.1');

      // Simulating existing instructions reload from service
      (component as any).loadExistingInstructions();
      expect(component.version).toBe('v1.1');
    });
  });
});
