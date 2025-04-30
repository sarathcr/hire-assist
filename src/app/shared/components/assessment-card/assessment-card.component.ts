import { NgClass } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ProgressBar } from 'primeng/progressbar';
import { SpeedDial } from 'primeng/speeddial';
import { TooltipModule } from 'primeng/tooltip';
import { Assessment } from '../../../pages/admin/models/assessment.model';

@Component({
  selector: 'app-assessment-card',
  imports: [
    ProgressBar,
    PopoverModule,
    SpeedDial,
    ButtonModule,
    NgClass,
    TooltipModule,
  ],
  templateUrl: './assessment-card.component.html',
  styleUrl: './assessment-card.component.scss',
})
export class AssessmentCardComponent implements OnInit {
  public data = input<Assessment>();
  public edit = output<Assessment>();
  public duplicate = output<Assessment>();
  public delete = output<number>();
  public showToggleButton = input<boolean>(true);

  public actionItems: MenuItem[] = [];
  public lastUpdatedInfo = '';

  ngOnInit(): void {
    this.setActionItems();

    const assessment = this.data();
    if (assessment) {
      this.lastUpdatedInfo = this.getLastUpdatedInfo(assessment);
    }
  }

  public onActionButtonClick(
    event: MouseEvent,
    toggleCallback: (data: Assessment) => void,
  ): void {
    event.stopPropagation();
    const assessment = this.data();
    if (assessment) {
      toggleCallback(assessment);
    }
  }

  public togglePopover(
    popover: { toggle: (event: Event) => void },
    event: Event,
  ): void {
    event.stopPropagation();
    popover.toggle(event);
  }

  private setActionItems(): void {
    this.actionItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: (e) => this.handleActionClick(e, 'edit'),
      },
      {
        label: 'Duplicate',
        icon: 'pi pi-copy',
        command: (e) => this.handleActionClick(e, 'duplicate'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: (e) => this.handleActionClick(e, 'delete'),
      },
    ];
  }

  private handleActionClick(
    event: MenuItemCommandEvent,
    type: 'edit' | 'duplicate' | 'delete',
  ): void {
    event.originalEvent?.stopPropagation();
    const assessment = this.data();

    if (!assessment) return;

    switch (type) {
      case 'edit':
        this.edit.emit(assessment);
        break;
      case 'duplicate':
        this.duplicate.emit(assessment);
        break;
      case 'delete':
        if (assessment.id) {
          this.delete.emit(assessment.id);
        }
        break;
    }
  }

  private getLastUpdatedInfo(data: Assessment): string {
    const updatedAt = this.parseDate(data.updatedAt);
    const createdAt = this.parseDate(data.createdAt);

    const referenceDate = updatedAt ?? createdAt;
    const isUpdate = !!updatedAt;

    if (!referenceDate) return '';

    const daysDiff = this.getDaysDifference(referenceDate, new Date());
    return this.formatDateDifference(daysDiff, isUpdate);
  }

  private parseDate(dateStr?: string | null): Date | null {
    if (!dateStr || dateStr === '0001-01-01T00:00:00') return null;

    const date = new Date(dateStr);
    return date.getFullYear() > 1 ? date : null;
  }

  private getDaysDifference(from: Date, to: Date): number {
    const start = new Date(from);
    const end = new Date(to);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private formatDateDifference(days: number, isUpdate: boolean): string {
    if (days < 0) return '';

    if (days === 0) return isUpdate ? 'Updated today' : 'Created today';
    if (days === 1)
      return isUpdate ? 'Last updated 1 day ago' : 'Created 1 day ago';
    if (days > 365) {
      const years = Math.floor(days / 365);
      return isUpdate
        ? `Last updated ${years} year${years > 1 ? 's' : ''} ago`
        : `Created ${years} year${years > 1 ? 's' : ''} ago`;
    }

    return isUpdate
      ? `Last updated ${days} days ago`
      : `Created ${days} days ago`;
  }

  public getProgressColor(value?: number | null): string {
    const percentage = value ?? 0;
    if (percentage > 90) return '#16a34a';
    if (percentage >= 75) return '#f97316';
    return '';
  }
}
