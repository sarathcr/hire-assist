import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonComponent } from '../../../../components/button/button.component';
import { InputMultiselectComponent } from '../../../../components/form/input-multiselect/input-multiselect.component';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { BaseComponent } from '../../../../components/base/base.component';
import { Option } from '../../../../models/option';
import { CustomSelectConfig, CustomTextInputConfig, isFormUnchanged } from '../../../../utilities/form.utility';
import { SkillsDto } from '../../models/basic-information.model';
import { ProfileServicesService } from '../../services/profile-services.service';

export interface SkillsDialogData {
  availableSkills: SkillsDto[];
  userSkills: SkillsDto[];
  onSave: (skills: SkillsDto[]) => void;
}

@Component({
  selector: 'app-skills-dialog',
  standalone: true,
  imports: [
    ButtonComponent,
    InputMultiselectComponent,
    InputTextComponent,
    ReactiveFormsModule,
    SkeletonModule,
  ],
  templateUrl: './skills-dialog.component.html',
  styleUrl: './skills-dialog.component.scss',
})
export class SkillsDialogComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: SkillsDialogData;
  public skillsForm!: FormGroup;
  public skillsConfig!: CustomSelectConfig;
  public newSkillConfig!: CustomTextInputConfig;
  public availableOptions: Option[] = [];
  public isLoading = false;
  public isAddingSkill = false;
  private initialSkillsValue: string[] = [];

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private profileServices: ProfileServicesService,
    private messageService: MessageService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.data = this.config.data;
    this.initializeForm();
    this.loadSkills();
  }

  private initializeForm(): void {
    this.skillsForm = new FormGroup({
      skills: new FormControl<string[]>([], [Validators.required]),
      newSkill: new FormControl<string>('', [
        Validators.minLength(1),
        Validators.maxLength(20),
        this.notOnlyNumbersValidator,
        this.noTrailingSpacesValidator,
      ]),
    });

    // Set initial selected skills
    let selectedIds: string[] = [];
    if (this.data?.userSkills && this.data.userSkills.length > 0) {
      selectedIds = this.data.userSkills
        .filter(s => s && s.id)
        .map((skill) => skill.id.toString());
      this.skillsForm.patchValue({ skills: selectedIds });
    }
    this.initialSkillsValue = selectedIds;

    // Initialize new skill config
    this.newSkillConfig = {
      id: 'newSkill',
      labelKey: 'Add New Skill',
      maxlength: 20,
    };
  }

  private notOnlyNumbersValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const isOnlyNumbers = /^\d+$/.test(value);
    return isOnlyNumbers ? { notOnlyNumbers: true } : null;
  }

  private noTrailingSpacesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasTrailingSpace = /\s$/.test(value);
    return hasTrailingSpace ? { trailingSpaces: true } : null;
  }

  private loadSkills(): void {
    this.isLoading = true;
    this.profileServices.getSkills().subscribe({
      next: (skills: SkillsDto[]) => {
        // Convert SkillsDto[] to Option[]
        this.availableOptions = (skills || []).map((skill) => ({
          label: skill.name || 'Unknown Skill',
          value: (skill.id || 0).toString(),
        }));

        // Update config
        this.skillsConfig = {
          id: 'skills',
          labelKey: 'Select Your Skills',
          options: this.availableOptions,
        };

        // Update form value after options are loaded to ensure multi-select displays correctly
        let selectedIds: string[] = [];
        if (this.data?.userSkills && this.data.userSkills.length > 0) {
          selectedIds = this.data.userSkills
            .filter((s) => s && s.id)
            .map((skill) => skill.id.toString());
          this.skillsForm.patchValue({ skills: selectedIds });
        }
        this.initialSkillsValue = selectedIds;

        this.isLoading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load skills',
        });
        this.isLoading = false;
      },
    });
  }

  override ngOnDestroy(): void {
    this.skillsForm.reset();
  }

  get isPristine(): boolean {
    return isFormUnchanged(this.skillsForm.get('skills')?.value, this.initialSkillsValue);
  }

  get isSaveDisabled(): boolean {
    return (
      this.isPristine ||
      this.skillsForm.get('skills')?.invalid ||
      !!this.skillsForm.get('newSkill')?.value
    );
  }

  public onSubmit(): void {
    this.skillsForm.markAllAsTouched();
    if (this.skillsForm.valid) {
      const selectedIds = this.skillsForm.get('skills')?.value as string[];
      if (!selectedIds) return;

      const selectedSkills: SkillsDto[] = selectedIds
        .map((id) => {
          const option = this.availableOptions?.find(
            (opt) => opt.value === id,
          );
          if (option) {
            return {
              id: parseInt(option.value, 10),
              name: option.label,
            };
          }
          return null;
        })
        .filter((skill): skill is SkillsDto => skill !== null);

      if (this.data?.onSave) {
        this.data.onSave(selectedSkills);
      }
      this.ref.close(selectedSkills);
    }
  }

  public onClose(): void {
    this.ref.close();
  }

  public onAddSkill(): void {
    const newSkillName = this.skillsForm.get('newSkill')?.value?.trim();
    if (!newSkillName || newSkillName.length < 1) {
      this.messageService?.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Skill name must be at least 1 character',
      });
      return;
    }

    const skillExists = (this.availableOptions || []).some(
      (option: Option) => option.label.toLowerCase() === newSkillName.toLowerCase(),
    );
    if (skillExists) {
      this.messageService?.add({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This skill already exists',
      });
      return;
    }

    this.isAddingSkill = true;
    this.profileServices.createSkill(newSkillName).subscribe({
      next: (newSkill: SkillsDto) => {
        if (newSkill) {
          const newOption: Option = {
            label: newSkill.name,
            value: newSkill.id.toString(),
          };
          this.availableOptions = [...(this.availableOptions || []), newOption];
 
          this.skillsConfig = {
            id: 'skills',
            labelKey: 'Select Your Skills',
            options: [...this.availableOptions],
          };
 
          const currentSelected = [...(this.skillsForm.get('skills')?.value as string[] || [])];
          currentSelected.push(newSkill.id.toString());
          this.skillsForm.patchValue({ skills: currentSelected });
          this.skillsForm.patchValue({ newSkill: '' });
          this.skillsForm.get('newSkill')?.reset();

          this.messageService?.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Skill added successfully',
          });
        }
        this.isAddingSkill = false;
      },
      error: (error: any) => {
        this.messageService?.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to create skill',
        });
        this.isAddingSkill = false;
      },
    });
  }
}

