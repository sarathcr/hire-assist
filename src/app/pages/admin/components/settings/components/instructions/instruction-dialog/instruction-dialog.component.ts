import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, inject, ViewChildren, QueryList } from '@angular/core';
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
import { TooltipModule, Tooltip } from 'primeng/tooltip';
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
  @ViewChildren(Tooltip) public tooltips!: QueryList<Tooltip>;
  public isDragging = false;

  // Form Fields
  public id?: number;
  public title = '';
  public description = '';
  public version = '1.0';
  public originalVersion = '1.0';
  public isDefault = false;
  public isActive = true;
  public sections: InstructionSection[] = [];
  public readonly MAX_SECTIONS = 10;
  public readonly MAX_RULES_PER_SECTION = 10;

  // Validation flags
  public titleTouched = false;
  public versionTouched = false;
  public descriptionTouched = false;
  public mobileSettingsOpen = false;
  public isMobileView = false;
  public hasCompletedRecruitmentReferences = false;
  public existingInstructions: Array<{ id: number; title: string; version: string }> = [];

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
    { label: 'Critical', colorName: 'Red', value: 'danger', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    { label: 'Info', colorName: 'Blue', value: 'info', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    { label: 'Success', colorName: 'Green', value: 'success', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    { label: 'Warning', colorName: 'Orange', value: 'warn', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  ];

  public iconOptions = [
    { label: 'Warning / Alert', shortLabel: 'Warning', value: 'pi pi-exclamation-triangle' },
    { label: 'Compass / Nav', shortLabel: 'Compass', value: 'pi pi-compass' },
    { label: 'Check / Success', shortLabel: 'Success', value: 'pi pi-check-circle' },
    { label: 'Info Circle', shortLabel: 'Info', value: 'pi pi-info-circle' },
    { label: 'Shield / Proctor', shortLabel: 'Shield', value: 'pi pi-shield' },
    { label: 'Clock / Time', shortLabel: 'Clock', value: 'pi pi-clock' },
    { label: 'Book / Rules', shortLabel: 'Rules', value: 'pi pi-book' },
    { label: 'Flag / Notice', shortLabel: 'Notice', value: 'pi pi-flag' },
    { label: 'Help / Question', shortLabel: 'Help', value: 'pi pi-question-circle' },
  ];

  public getSeverityOption(itemOrVal?: any) {
    const val = typeof itemOrVal === 'string' ? itemOrVal : itemOrVal?.value;
    return this.severityOptions.find((o) => o.value === val) || this.severityOptions[1];
  }

  public getIconOption(itemOrVal?: any) {
    const val = typeof itemOrVal === 'string' ? itemOrVal : itemOrVal?.value;
    return this.iconOptions.find((o) => o.value === val) || this.iconOptions[3];
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth <= 768;
      if (mobile && !this.isMobileView && this.viewMode === 'split') {
        this.viewMode = 'builder';
      }
      this.isMobileView = mobile;
    }
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView = window.innerWidth <= 768;
    }

    const data = this.config.data as InstructionDialogData;
    if (data) {
      this.mode = data.mode || 'create';
      if (this.mode === 'preview') {
        this.viewMode = 'preview';
      } else if (this.isMobileView) {
        this.viewMode = 'builder';
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

    this.loadExistingInstructions();
  }

  private loadExistingInstructions(): void {
    this.instructionService.getInstructions(false).subscribe({
      next: (list) => {
        this.existingInstructions = (list || []).map((item) => ({
          id: item.id,
          title: (item.title || '').trim(),
          version: (item.version || '').trim(),
        }));
        if (this.mode === 'clone') {
          this.version = this.computeNextVersion(this.originalVersion, this.title);
        }
      },
      error: () => {
        this.existingInstructions = [];
      },
    });
  }

  private initDefaultSections(): void {
    this.title = 'Online Aptitude Assessment Rules';
    this.description = 'Standard proctoring, navigation, and submission guidelines.';
    this.originalVersion = '1.0';
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
      this.version = this.computeNextVersion(this.originalVersion);
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
    this.originalVersion = inst.version || '1.0';
    this.version = this.originalVersion;
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

    this.hasCompletedRecruitmentReferences = !!(inst.hasRecruitmentReferences ?? inst.hasCompletedRecruitmentReferences);

    if (this.mode === 'clone') {
      this.version = this.computeNextVersion(this.originalVersion, this.title);
    }
    this.takeSnapshot();
  }

  private computeNextVersion(v: string, title?: string): string {
    let candidate = this.incrementVersionString(v);
    const targetTitle = (title || this.title || '').trim().toLowerCase();
    if (!targetTitle || !this.existingInstructions?.length) {
      return candidate;
    }
    let safetyLimit = 50;
    while (
      safetyLimit > 0 &&
      this.existingInstructions.some(
        (item) =>
          (item.title || '').trim().toLowerCase() === targetTitle &&
          this.normalizeVersion(item.version) === this.normalizeVersion(candidate),
      )
    ) {
      candidate = this.incrementVersionString(candidate);
      safetyLimit--;
    }
    return candidate;
  }

  private incrementVersionString(v: string): string {
    const clean = (v || '1.0').trim();
    const parts = clean.split('.');
    if (parts.length >= 2 && !isNaN(Number(parts[parts.length - 1]))) {
      const last = Number(parts[parts.length - 1]);
      parts[parts.length - 1] = String(last + 1);
      return parts.join('.');
    } else if (parts.length === 1 && !isNaN(Number(parts[0].replace(/^v/i, '')))) {
      return `${parts[0]}.1`;
    }
    return '1.1';
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

  public onTitleInput(): void {
    if ((this.title || '').length > 150 || (this.title || '').length >= 3) {
      this.titleTouched = true;
    }
  }

  public get isTitleValid(): boolean {
    const raw = this.title || '';
    const t = raw.trim();
    return t.length >= 3 && raw.length <= 150;
  }

  public get titleErrorMessage(): string {
    const raw = this.title || '';
    const t = raw.trim();
    if (!t) return 'Instruction Title is required.';
    if (t.length < 3) return 'Title must be at least 3 characters.';
    if (raw.length > 150) return `Title cannot exceed 150 characters (currently ${raw.length}).`;
    return '';
  }

  public onVersionInput(): void {
    this.versionTouched = true;
  }

  public get isVersionValid(): boolean {
    const v = (this.version || '').trim();
    if (!v) return false;
    const versionRegex = /^v?[0-9]+(\.[0-9]+){0,3}$/i;
    return versionRegex.test(v) && v.length <= 15;
  }

  public get versionErrorMessage(): string {
    const v = (this.version || '').trim();
    if (!v) return 'Version tag is required.';
    if (v.length > 15) return 'Version tag cannot exceed 15 characters.';
    const versionRegex = /^v?[0-9]+(\.[0-9]+){0,3}$/i;
    if (!versionRegex.test(v)) {
      return 'Must be numeric format (e.g. 1.0 or v2.0).';
    }
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

  public normalizeVersion(v: string | undefined | null): string {
    if (!v) return '';
    let clean = v.trim().toLowerCase();
    if (clean.startsWith('v')) {
      clean = clean.substring(1).trim();
    }
    return clean;
  }

  public isDuplicateForAction(action: 'save' | 'saveAsNewVersion'): boolean {
    const currentTitle = (this.title || '').trim().toLowerCase();
    const currentVersion = this.normalizeVersion(this.version);
    if (!currentTitle || !currentVersion) return false;

    return this.existingInstructions.some((item) => {
      if (action === 'save' && this.mode === 'edit' && item.id === this.id) {
        return false;
      }
      const itemTitle = (item.title || '').trim().toLowerCase();
      const itemVersion = this.normalizeVersion(item.version);
      return itemTitle === currentTitle && itemVersion === currentVersion;
    });
  }

  public get isDuplicateTitleAndVersion(): boolean {
    if (this.mode === 'preview') {
      return false;
    }
    if (
      this.mode === 'edit' &&
      this.hasCompletedRecruitmentReferences &&
      this.hasContentOrTitleChanges() &&
      this.normalizeVersion(this.version) === this.normalizeVersion(this.originalVersion)
    ) {
      return false;
    }
    const action =
      (this.mode === 'edit' &&
        this.hasCompletedRecruitmentReferences &&
        this.hasContentOrTitleChanges()) ||
      this.mode === 'clone'
        ? 'saveAsNewVersion'
        : 'save';
    return this.isDuplicateForAction(action);
  }

  public get duplicateErrorMessage(): string {
    return 'An instruction with this title and version already exists.';
  }

  public get areSectionsValid(): boolean {
    if (
      !this.sections ||
      this.sections.length === 0 ||
      this.sections.length > this.MAX_SECTIONS
    ) {
      return false;
    }
    return this.sections.every(
      (sec) =>
        sec.title &&
        sec.title.trim().length > 0 &&
        sec.title.length <= 100 &&
        sec.rules &&
        sec.rules.length > 0 &&
        sec.rules.length <= this.MAX_RULES_PER_SECTION &&
        sec.rules.every(
          (r) =>
            r !== undefined &&
            r !== null &&
            r.trim().length > 0 &&
            r.length <= 300,
        ),
    );
  }

  public get isFormValid(): boolean {
    return (
      this.isTitleValid &&
      this.isVersionValid &&
      this.isDescriptionValid &&
      this.sections.length > 0 &&
      this.areSectionsValid &&
      !this.isDuplicateTitleAndVersion
    );
  }

  // Drag & Drop Reordering Lifecycle and Tooltip Management
  public onDragStart(): void {
    this.isDragging = true;
    this.hideAllTooltips();
  }

  public onDragEnd(): void {
    this.hideAllTooltips();
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  public onDragHandlePointerDown(): void {
    this.hideAllTooltips();
  }

  public hideAllTooltips(): void {
    if (this.tooltips) {
      this.tooltips.forEach((tooltip) => {
        try {
          tooltip.deactivate();
        } catch {
          // Safe fallback
        }
      });
    }
    if (typeof document !== 'undefined') {
      const tooltipElements = document.querySelectorAll('.p-tooltip');
      tooltipElements.forEach((el) => {
        el.remove();
      });
    }
  }

  // Drag & Drop Reordering for Sections
  public onSectionDrop(event: CdkDragDrop<InstructionSection[]>): void {
    this.hideAllTooltips();
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
    this.sections = [...this.sections];
  }

  // Drag & Drop Reordering for Rules inside a Section
  public onRuleDrop(event: CdkDragDrop<string[]>, sectionIndex: number): void {
    this.hideAllTooltips();
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.sections[sectionIndex].rules, event.previousIndex, event.currentIndex);
    this.sections[sectionIndex].rules = [...this.sections[sectionIndex].rules];
  }

  // Component Palette Actions
  public addComponentFromPreset(presetKey: string): void {
    if (this.sections.length >= this.MAX_SECTIONS) return;
    const preset = this.componentPresets.find((p) => p.key === presetKey);
    if (!preset) return;

    this.sections.push({
      title: preset.defaultTitle,
      severity: preset.severity,
      icon: preset.icon,
      rules: [...preset.defaultRules].slice(0, this.MAX_RULES_PER_SECTION),
      collapsed: false,
    });
  }

  public addSection(): void {
    if (this.sections.length >= this.MAX_SECTIONS) return;
    this.sections.push({
      title: 'New Instruction Section',
      severity: 'info',
      icon: 'pi pi-info-circle',
      rules: ['Enter specific rule here...'],
      collapsed: false,
    });
  }

  public duplicateSection(index: number): void {
    if (this.sections.length >= this.MAX_SECTIONS) return;
    const src = this.sections[index];
    const cloneTitle = `${src.title || ''} (Copy)`.slice(0, 100);
    const clone: InstructionSection = {
      title: cloneTitle,
      severity: src.severity,
      icon: src.icon,
      rules: [...src.rules].slice(0, this.MAX_RULES_PER_SECTION),
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
    if (this.sections[sectionIndex].rules.length >= this.MAX_RULES_PER_SECTION) return;
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

  public formatRule(rule: string): string {
    if (!rule) return '';
    const safeRule = this.escapeHtml(rule);
    if (!safeRule.includes('<strong>') && safeRule.includes(':')) {
      const colonIdx = safeRule.indexOf(':');
      return `<strong>${safeRule.substring(0, colonIdx + 1)}</strong>${safeRule.substring(colonIdx + 1)}`;
    }
    return safeRule;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public onSave(): void {
    if (this.hasCompletedRecruitmentReferences && this.hasContentOrTitleChanges()) {
      this.onSaveAsNewVersion();
      return;
    }

    this.titleTouched = true;
    this.versionTouched = true;
    this.descriptionTouched = true;
    if (!this.isFormValid) return;

    const sanitizedSections = this.sections.map(({ collapsed, ...rest }) => ({
      ...rest,
      title: (rest.title || '').trim().slice(0, 100),
      rules: (rest.rules || [])
        .map((r) => (r || '').trim())
        .filter((r) => r.length > 0)
        .map((r) => r.slice(0, 300)),
    }));

    const payload = {
      id: this.id || 0,
      title: this.title.trim(),
      description: this.description.trim(),
      version: this.version.trim(),
      content: JSON.stringify(sanitizedSections),
      isDefault: this.isDefault,
      isActive: this.isActive,
    };

    this.ref.close({
      action: this.mode === 'edit' ? 'update' : 'create',
      data: payload,
    });
  }

  public onSaveAsNewVersion(): void {
    if (this.normalizeVersion(this.version) === this.normalizeVersion(this.originalVersion)) {
      this.version = this.computeNextVersion(this.originalVersion, this.title);
    }
    this.titleTouched = true;
    this.versionTouched = true;
    this.descriptionTouched = true;
    if (this.isDuplicateForAction('saveAsNewVersion') || !this.isFormValid) return;

    const sanitizedSections = this.sections.map(({ collapsed, ...rest }) => ({
      ...rest,
      title: (rest.title || '').trim().slice(0, 100),
      rules: (rest.rules || [])
        .map((r) => (r || '').trim())
        .filter((r) => r.length > 0)
        .map((r) => r.slice(0, 300)),
    }));

    const payload = {
      sourceInstructionId: this.id,
      title: this.title.trim(),
      description: this.description.trim(),
      version: this.version.trim(),
      content: JSON.stringify(sanitizedSections),
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
