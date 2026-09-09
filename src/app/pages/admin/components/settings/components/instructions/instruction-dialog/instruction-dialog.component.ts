import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { InstructionService } from '../../../../../services/instruction.service';
import {
  AptitudeInstruction,
  InstructionSection,
} from '../../../../../models/instruction.model';

export interface InstructionDialogData {
  mode: 'create' | 'edit' | 'clone' | 'preview';
  instructionId?: number;
  initialInstruction?: Partial<AptitudeInstruction>;
}

export interface ComponentPreset {
  key: string;
  label: string;
  icon: string;
  severity: 'danger' | 'info' | 'success' | 'warn';
  defaultTitle: string;
  defaultRules: string[];
}

@Component({
  selector: 'app-instruction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    ButtonComponent,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    SelectModule,
    TooltipModule,
  ],
  templateUrl: './instruction-dialog.component.html',
  styleUrl: './instruction-dialog.component.scss',
})
export class InstructionDialogComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private instructionService = inject(InstructionService);

  public mode: 'create' | 'edit' | 'clone' | 'preview' = 'create';
  public viewMode: 'split' | 'builder' | 'preview' = 'split';
  public isLoading = false;
  public isSubmitting = false;

  // Form Fields
  public id?: number;
  public title = '';
  public description = '';
  public version = '1.0';
  public isDefault = false;
  public isActive = true;
  public sections: InstructionSection[] = [];

  // Validation flags
  public titleTouched = false;
  public descriptionTouched = false;
  public hasCompletedRecruitmentReferences = false;

  private initialSnapshot = '';
  private initialContentSnapshot = '';

  // Component Presets Palette
  public componentPresets: ComponentPreset[] = [
    {
      key: 'proctoring',
      label: 'Proctoring Rules',
      icon: 'pi pi-exclamation-triangle',
      severity: 'danger',
      defaultTitle: 'Critical Proctoring Rules',
      defaultRules: [
        'Full-Screen Mode: Upon starting, the assessment enters full-screen mode. You must remain in this mode throughout.',
        'Strict Proctoring: Exiting full-screen mode or switching tabs/apps will immediately terminate your test.',
        'Session Lock: If your session terminates due to technical issues, contact the administrator immediately.',
      ],
    },
    {
      key: 'navigation',
      label: 'Exam Navigation',
      icon: 'pi pi-compass',
      severity: 'info',
      defaultTitle: 'Test Navigation & Flow',
      defaultRules: [
        "Answer & Next: Select your answer and click 'Next' to save and proceed.",
        "Mark for Review: Use 'Mark for Review' to easily revisit uncertain questions.",
        'Question Palette: Jump directly to any section or question using the status palette.',
      ],
    },
    {
      key: 'timer',
      label: 'Time & Auto-Submit',
      icon: 'pi pi-clock',
      severity: 'warn',
      defaultTitle: 'Timing & Auto-Submission',
      defaultRules: [
        'Countdown Timer: The session countdown timer is always displayed at the top-right corner.',
        'Auto-Submit: When the timer expires, all attempted answers are automatically saved and submitted.',
      ],
    },
    {
      key: 'support',
      label: 'Help & Support',
      icon: 'pi pi-check-circle',
      severity: 'success',
      defaultTitle: 'Candidate Support & Guidelines',
      defaultRules: [
        'Permitted Tools: Built-in scratchpad and on-screen calculator are available where permitted.',
        'Technical Assistance: For any hardware or network issues, notify the invigilator immediately.',
      ],
    },
    {
      key: 'custom',
      label: 'Custom Block',
      icon: 'pi pi-book',
      severity: 'info',
      defaultTitle: 'Special Guidelines',
      defaultRules: ['Enter specific rule or requirement for candidates here...'],
    },
  ];

  // Options
  public severityOptions = [
    { label: 'Critical / Danger (Red)', value: 'danger' },
    { label: 'Info / Navigation (Blue)', value: 'info' },
    { label: 'Success / Support (Green)', value: 'success' },
    { label: 'Warning / Attention (Orange)', value: 'warn' },
  ];

  public iconOptions = [
    { label: 'Warning / Alert', value: 'pi pi-exclamation-triangle' },
    { label: 'Compass / Navigation', value: 'pi pi-compass' },
    { label: 'Check Circle / Success', value: 'pi pi-check-circle' },
    { label: 'Info Circle', value: 'pi pi-info-circle' },
    { label: 'Shield / Proctoring', value: 'pi pi-shield' },
    { label: 'Clock / Time', value: 'pi pi-clock' },
    { label: 'Book / Rules', value: 'pi pi-book' },
    { label: 'Flag / Notice', value: 'pi pi-flag' },
    { label: 'Question Circle', value: 'pi pi-question-circle' },
  ];

  ngOnInit(): void {
    const data = this.config.data as InstructionDialogData;
    if (data) {
      this.mode = data.mode || 'create';
      if (this.mode === 'preview') {
        this.viewMode = 'preview';
      } else {
        this.viewMode = 'split';
      }

      if (data.instructionId) {
        this.loadInstruction(data.instructionId);
      } else if (data.initialInstruction) {
        this.populateFromObject(data.initialInstruction);
      } else {
        this.initDefaultSections();
      }
    } else {
      this.initDefaultSections();
    }
  }

  private initDefaultSections(): void {
    this.title = 'Online Aptitude Assessment Rules';
    this.description = 'Standard proctoring, navigation, and submission guidelines.';
    this.version = '1.0';
    this.isDefault = false;
    this.isActive = true;
    this.sections = [
      {
        title: 'Critical Proctoring Rules',
        severity: 'danger',
        icon: 'pi pi-exclamation-triangle',
        rules: [
          'Full-Screen Mode: Upon starting, the assessment will enter full-screen mode. You must remain in this mode throughout the session.',
          'Strict Proctoring: Exiting full-screen mode or switching to other browser tabs/applications will immediately terminate your test.',
          'Locked Assessment: If your session is terminated due to technical issues, please contact the HR manager to unlock it.',
        ],
        collapsed: false,
      },
      {
        title: 'Test Navigation',
        severity: 'info',
        icon: 'pi pi-compass',
        rules: [
          "Select an answer and click 'Next' to save and move forward.",
          "Use 'Mark for Review' to revisit a question later.",
          "Click 'Skip' if you wish to bypass a question.",
          'Flexibility: You can return and update your answers at any time until the timer expires.',
        ],
        collapsed: false,
      },
      {
        title: 'Submission & Support',
        severity: 'success',
        icon: 'pi pi-check-circle',
        rules: [
          'Auto-Submission: Once the timer expires, all attempted answers are automatically saved and submitted.',
          'Assistance: For any confusion or technical difficulties, please contact the volunteers present in the room.',
        ],
        collapsed: false,
      },
    ];

    if (this.mode === 'clone') {
      this.version = this.computeNextVersion(this.version);
    }
    this.takeSnapshot();
  }

  private loadInstruction(id: number): void {
    this.isLoading = true;
    this.instructionService.getInstructionById(id).subscribe({
      next: (instruction) => {
        this.populateFromObject(instruction);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private populateFromObject(inst: Partial<AptitudeInstruction>): void {
    this.id = inst.id;
    this.title = inst.title || '';
    this.description = inst.description || '';
    this.version = inst.version || '1.0';
    this.isDefault = inst.isDefault || false;
    this.isActive = inst.isActive ?? true;

    if (inst.content) {
      try {
        const parsed = JSON.parse(inst.content);
        this.sections = Array.isArray(parsed)
          ? parsed.map((s) => ({ ...s, collapsed: false }))
          : [];
      } catch {
        this.sections = [];
      }
    } else {
      this.initDefaultSections();
    }

    this.hasCompletedRecruitmentReferences = !!inst.hasCompletedRecruitmentReferences;

    if (this.mode === 'clone' || this.hasCompletedRecruitmentReferences) {
      this.version = this.computeNextVersion(this.version);
    }
    this.takeSnapshot();
  }

  private computeNextVersion(v: string): string {
    const parts = (v || '1.0').split('.');
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      return `${parts[0]}.${Number(parts[1]) + 1}`;
    } else if (parts.length === 1 && !isNaN(Number(parts[0]))) {
      return `${parts[0]}.1`;
    }
    return `${v || '1.0'}_new`;
  }

  private takeSnapshot(): void {
    this.initialSnapshot = JSON.stringify({
      title: (this.title || '').trim(),
      description: (this.description || '').trim(),
      version: (this.version || '').trim(),
      isDefault: !!this.isDefault,
      isActive: !!this.isActive,
      sections: (this.sections || []).map(({ collapsed, ...rest }) => rest),
    });
    this.initialContentSnapshot = JSON.stringify({
      title: (this.title || '').trim(),
      description: (this.description || '').trim(),
      sections: (this.sections || []).map(({ collapsed, ...rest }) => rest),
    });
  }

  public hasChanges(): boolean {
    const current = JSON.stringify({
      title: (this.title || '').trim(),
      description: (this.description || '').trim(),
      version: (this.version || '').trim(),
      isDefault: !!this.isDefault,
      isActive: !!this.isActive,
      sections: (this.sections || []).map(({ collapsed, ...rest }) => rest),
    });
    return current !== this.initialSnapshot;
  }

  public hasContentOrTitleChanges(): boolean {
    const current = JSON.stringify({
      title: (this.title || '').trim(),
      description: (this.description || '').trim(),
      sections: (this.sections || []).map(({ collapsed, ...rest }) => rest),
    });
    return current !== this.initialContentSnapshot;
  }

  public get isTitleValid(): boolean {
    const t = (this.title || '').trim();
    return t.length >= 3 && t.length <= 150;
  }

  public get titleErrorMessage(): string {
    const t = (this.title || '').trim();
    if (!t) return 'Instruction Title is required.';
    if (t.length < 3) return 'Title must be at least 3 characters.';
    if (t.length > 150) return 'Title cannot exceed 150 characters.';
    return '';
  }

  public get isDescriptionValid(): boolean {
    return (this.description || '').length <= 500;
  }

  public get descriptionErrorMessage(): string {
    if ((this.description || '').length > 500) {
      return 'Intro note cannot exceed 500 characters.';
    }
    return '';
  }

  public get isFormValid(): boolean {
    return this.isTitleValid && this.isDescriptionValid && this.sections.length > 0;
  }

  // Drag & Drop Reordering for Sections
  public onSectionDrop(event: CdkDragDrop<InstructionSection[]>): void {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }

  // Drag & Drop Reordering for Rules inside a Section
  public onRuleDrop(event: CdkDragDrop<string[]>, sectionIndex: number): void {
    moveItemInArray(this.sections[sectionIndex].rules, event.previousIndex, event.currentIndex);
  }

  // Component Palette Actions
  public addComponentFromPreset(presetKey: string): void {
    const preset = this.componentPresets.find((p) => p.key === presetKey);
    if (!preset) return;

    this.sections.push({
      title: preset.defaultTitle,
      severity: preset.severity,
      icon: preset.icon,
      rules: [...preset.defaultRules],
      collapsed: false,
    });
  }

  public addSection(): void {
    this.sections.push({
      title: 'New Instruction Section',
      severity: 'info',
      icon: 'pi pi-info-circle',
      rules: ['Enter specific rule here...'],
      collapsed: false,
    });
  }

  public duplicateSection(index: number): void {
    const src = this.sections[index];
    const clone: InstructionSection = {
      title: `${src.title} (Copy)`,
      severity: src.severity,
      icon: src.icon,
      rules: [...src.rules],
      collapsed: false,
    };
    this.sections.splice(index + 1, 0, clone);
  }

  public toggleSectionCollapse(index: number): void {
    this.sections[index].collapsed = !this.sections[index].collapsed;
  }

  public removeSection(index: number): void {
    if (this.sections.length > 1) {
      this.sections.splice(index, 1);
    }
  }

  public addRule(sectionIndex: number): void {
    this.sections[sectionIndex].rules.push('');
  }

  public removeRule(sectionIndex: number, ruleIndex: number): void {
    if (this.sections[sectionIndex].rules.length > 1) {
      this.sections[sectionIndex].rules.splice(ruleIndex, 1);
    }
  }

  public setViewMode(mode: 'split' | 'builder' | 'preview'): void {
    this.viewMode = mode;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public onSave(): void {
    if (this.hasCompletedRecruitmentReferences && this.hasContentOrTitleChanges()) {
      this.onSaveAsNewVersion();
      return;
    }

    this.titleTouched = true;
    this.descriptionTouched = true;
    if (!this.isFormValid) return;

    const payload = {
      id: this.id || 0,
      title: this.title.trim(),
      description: this.description.trim(),
      version: this.version.trim(),
      content: JSON.stringify(
        this.sections.map(({ collapsed, ...rest }) => rest),
      ),
      isDefault: this.isDefault,
      isActive: this.isActive,
    };

    this.ref.close({
      action: this.mode === 'edit' ? 'update' : 'create',
      data: payload,
    });
  }

  public onSaveAsNewVersion(): void {
    this.titleTouched = true;
    this.descriptionTouched = true;
    if (!this.isFormValid) return;

    const payload = {
      sourceInstructionId: this.id,
      title: this.title.trim(),
      description: this.description.trim(),
      version: this.version.trim(),
      content: JSON.stringify(
        this.sections.map(({ collapsed, ...rest }) => rest),
      ),
      isDefault: this.isDefault,
    };

    this.ref.close({
      action: 'saveAsNewVersion',
      data: payload,
    });
  }

  public onClose(): void {
    this.ref.close();
  }
}
