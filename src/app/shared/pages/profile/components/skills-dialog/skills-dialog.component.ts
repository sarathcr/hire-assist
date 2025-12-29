import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../components/button/button.component';
import { InputMultiselectComponent } from '../../../../components/form/input-multiselect/input-multiselect.component';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { BaseComponent } from '../../../../components/base/base.component';
import { Option } from '../../../../models/option';
import { CustomSelectConfig, CustomTextInputConfig } from '../../../../utilities/form.utility';
import { SkillsDto } from '../../models/basic-information.model';
import { ProfileServicesService } from '../../services/profile-services.service';

export interface SkillsDialogData {
  availableSkills: SkillsDto[];
  userSkills: SkillsDto[];
  onSave: (skills: SkillsDto[]) => void;
}

@Component({
  selector: 'app-skills-dialog',
  imports: [
    ButtonComponent,
    InputMultiselectComponent,
    InputTextComponent,
    ReactiveFormsModule,
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
      newSkill: new FormControl<string>('', [Validators.minLength(2)]),
    });

    // Set initial selected skills
    if (this.data.userSkills && this.data.userSkills.length > 0) {
      const selectedIds = this.data.userSkills.map((skill) => skill.id.toString());
      this.skillsForm.patchValue({ skills: selectedIds });
    }

    // Initialize new skill config
    this.newSkillConfig = {
      id: 'newSkill',
      labelKey: 'Add New Skill',
    };
  }

  private loadSkills(): void {
    this.isLoading = true;
    this.profileServices.getSkills().subscribe({
      next: (skills: SkillsDto[]) => {
        // Convert SkillsDto[] to Option[]
        this.availableOptions = skills.map((skill) => ({
          label: skill.name,
          value: skill.id.toString(),
        }));

        // Update config
        this.skillsConfig = {
          id: 'skills',
          labelKey: 'Select Skills',
          options: this.availableOptions,
        };

        // Update form value after options are loaded to ensure multi-select displays correctly
        if (this.data.userSkills && this.data.userSkills.length > 0) {
          const selectedIds = this.data.userSkills.map((skill) => skill.id.toString());
          this.skillsForm.patchValue({ skills: selectedIds });
        }

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

  public onSubmit(): void {
    this.skillsForm.markAllAsTouched();
    if (this.skillsForm.valid) {
      const selectedIds = this.skillsForm.get('skills')?.value as string[];
      const selectedSkills: SkillsDto[] = selectedIds
        .map((id) => {
          const option = this.availableOptions.find(
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

      if (this.data.onSave) {
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
    if (!newSkillName || newSkillName.length < 2) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Skill name must be at least 2 characters',
      });
      return;
    }

    const skillExists = this.availableOptions.some(
      (option) => option.label.toLowerCase() === newSkillName.toLowerCase(),
    );
    if (skillExists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate',
        detail: 'This skill already exists',
      });
      return;
    }

    this.isAddingSkill = true;
    this.profileServices.createSkill(newSkillName).subscribe({
      next: (newSkill: SkillsDto) => {
        const newOption: Option = {
          label: newSkill.name,
          value: newSkill.id.toString(),
        };
        this.availableOptions.push(newOption);

        this.skillsConfig = {
          id: 'skills',
          labelKey: 'Select Skills',
          options: this.availableOptions,
        };

        const currentSelected = this.skillsForm.get('skills')?.value as string[] || [];
        currentSelected.push(newSkill.id.toString());
        this.skillsForm.patchValue({ skills: currentSelected });
        this.skillsForm.patchValue({ newSkill: '' });
        this.skillsForm.get('newSkill')?.reset();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill added successfully',
        });
        this.isAddingSkill = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to create skill',
        });
        this.isAddingSkill = false;
      },
    });
  }
}

