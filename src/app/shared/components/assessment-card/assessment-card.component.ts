import { DecimalPipe, NgClass, DatePipe } from '@angular/common';
import { Component, input, OnInit, output, ViewChild, inject, computed } from '@angular/core';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ProgressBar } from 'primeng/progressbar';
import { SpeedDial } from 'primeng/speeddial';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Assessment } from '../../../pages/admin/models/assessment.model';
import { DropdownManagerService } from '../../services/dropdown-manager.service';

export interface DistinctUser {
  userId: string;
  roles: string[];
  rolesText: string;
  tooltipText: string;
}

@Component({
  selector: 'app-assessment-card',
  imports: [
    ProgressBar,
    PopoverModule,
    SpeedDial,
    ButtonModule,
    NgClass,
    TooltipModule,
    DecimalPipe,
    TagModule,
    DatePipe,
  ],
  templateUrl: './assessment-card.component.html',
  styleUrl: './assessment-card.component.scss',
})
export class AssessmentCardComponent implements OnInit {
  @ViewChild(SpeedDial) speedDial!: SpeedDial;

  public data = input<Assessment>();
  public edit = output<Assessment>();
  public delete = output<number>();
  public schedule = output<Assessment>();
  public showToggleButton = input<boolean>(true);
  public actionItems: MenuItem[] = [];
  public lastUpdatedInfo = '';
  public showContent = input<boolean>(true);

  public distinctUsers = computed<DistinctUser[]>(() => {
    const rawUsers = this.data()?.users ?? [];
    const userMap = new Map<string, DistinctUser>();

    for (const u of rawUsers) {
      if (!u?.userId) continue;
      const key = u.userId.toLowerCase().trim();
      const existing = userMap.get(key);

      const newRoles = u.role
        ? u.role
            .split(',')
            .map((r) => r.trim())
            .filter((r) => r.length > 0)
        : [];

      if (!existing) {
        userMap.set(key, {
          userId: u.userId,
          roles: [...newRoles],
          rolesText: '',
          tooltipText: '',
        });
      } else {
        for (const role of newRoles) {
          if (!existing.roles.includes(role)) {
            existing.roles.push(role);
          }
        }
      }
    }

    return Array.from(userMap.values()).map((user) => {
      const rolesText = user.roles.join(', ');
      return {
        ...user,
        rolesText,
        tooltipText: rolesText ? `${user.userId} (${rolesText})` : user.userId,
      };
    });
  });

  public getAvatarTooltipOffset(el?: HTMLElement, text?: string): number {
    if (typeof window === 'undefined' || !el) return 0;
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;

    const textLength = text?.length ?? 25;
    // Accurate character width (8.2px per char at 0.75rem Poppins) + 36px padding/border
    const estimatedTooltipWidth = Math.max(120, Math.ceil(textLength * 8.2 + 36));
    const halfWidth = estimatedTooltipWidth / 2;
    const centerX = rect.left + rect.width / 2;
    const padding = 24;

    if (centerX + halfWidth > window.innerWidth - padding) {
      return -Math.ceil((centerX + halfWidth) - (window.innerWidth - padding));
    }
    if (centerX - halfWidth < padding) {
      return Math.ceil(padding - (centerX - halfWidth));
    }
    return 0;
  }

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

  private dropdownManager = inject(DropdownManagerService);

  public togglePopover(
    popover: any,
    event: Event,
  ): void {
    event.stopPropagation();
    const target = (event.currentTarget || event.target) as HTMLElement;
    this.dropdownManager.registerOpen(popover, target);
    popover.toggle(event);
  }

  public onPopoverHide(popover: any): void {
    this.dropdownManager.registerClose(popover);
  }

  private setActionItems(): void {
    const assessment = this.data();
    
    const activeRoundsPercentage = Number(assessment?.activeRoundsPercentage ?? 0);
    
    const isInactiveNotStarted = assessment?.status === 'Inactive' && activeRoundsPercentage === 0;
    
    let isCompleted = false;
    if (assessment?.status) {
      const statusLower = assessment.status.toLowerCase();
      if (statusLower === 'completed') {
        isCompleted = true;
      } else if (statusLower === 'active' || statusLower === 'inactive') {
        isCompleted = false;
      } else {
        isCompleted = assessment?.isActive === false && !isInactiveNotStarted && activeRoundsPercentage !== 100;
      }
    } else {
      isCompleted = assessment?.isActive === false && !isInactiveNotStarted && activeRoundsPercentage !== 100;
    }
    
    // A recruitment is in progress if it has started rounds but is not fully completed
    const isInProgress = activeRoundsPercentage > 0 && !isCompleted;

    this.actionItems = [];
    
    if (!isCompleted) {
      // We can always edit an active recruitment (to change end date etc.)
      this.actionItems.push({
        label: 'Edit',
        icon: 'pi pi-pencil',
        tooltipOptions: { tooltipLabel: 'Edit', tooltipPosition: 'top' },
        command: (e) => this.handleActionClick(e, 'edit'),
      });
      
      // We can only delete it if it hasn't started yet
      if (!isInProgress) {
        this.actionItems.push({
          label: 'Delete',
          icon: 'pi pi-trash',
          tooltipOptions: { tooltipLabel: 'Delete', tooltipPosition: 'top' },
          command: (e) => this.handleActionClick(e, 'delete'),
        });
      }
    }
  }

  private handleActionClick(
    event: MenuItemCommandEvent,
    type: 'schedule' | 'edit' | 'delete',
  ): void {
    event.originalEvent?.stopPropagation();
    const assessment = this.data();

    if (!assessment) return;

    switch (type) {
      case 'schedule':
        this.schedule.emit(assessment);
        break;
      case 'edit':
        this.edit.emit(assessment);
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
    return 'var(--primary-color)';
  }

  public getStatusSeverity(status?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'completed':
        return 'info';
      default:
        return 'secondary';
    }
  }

  public getUserInitials(userId: string): string {
    if (!userId) return '?';
    const namePart = userId.split('@')[0];
    const parts = namePart.split(/[\.\-_]/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  }
}

