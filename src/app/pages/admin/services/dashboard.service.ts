import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { DASHBOARD_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RecentActivity } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService<T> extends ApiService<T> {
  override getResourceUrl(): string {
    return DASHBOARD_URL;
  }
  constructor(
    httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  public getDashboardDetails(): Observable<T> {
    this.store.setIsLoading(true);
    return this.http.get<T>(this.getResourceUrl()).pipe(
      tap(() => this.store.setIsLoading(false)),
      catchError((error) => {
        this.store.setIsLoading(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Processes recent activities to fix unknown assessment names and missing icons.
   */
  public processRecentActivities(activities: RecentActivity[]): RecentActivity[] {
    if (!activities) return [];
    console.log('HireAssist RecentActivity payload:', activities); // Debug log to see actual backend payload structure
    return activities.map(activity => {
      let updatedActivity = { ...activity };

      if (
        updatedActivity.assessmentName &&
        (updatedActivity.assessmentName.trim().toLowerCase() === 'unknown recruitment' ||
         updatedActivity.assessmentName.trim().toLowerCase() === 'unknown')
      ) {
        const textToParse = updatedActivity.details || updatedActivity.message || '';
        const match = textToParse.match(/Recruitment\s+['"“‘]([^'"”’]+)['"”’]/i);
        if (match && match[1]) {
          updatedActivity.assessmentName = match[1];
        }
      }

      // Force 'pi pi-trash' for all delete/remove/archive actions
      if (this.isDeleteActivity(updatedActivity)) {
        updatedActivity.icon = 'pi pi-trash';
      } else {
        // Check and map missing, empty, or invalid icon for other actions
        const rawIcon = updatedActivity.icon;
        const iconStr = String(rawIcon || '').trim().toLowerCase();
        
        if (
          !rawIcon ||
          iconStr === '' ||
          iconStr === 'null' ||
          iconStr === 'undefined' ||
          iconStr === 'none' ||
          (!iconStr.includes('pi-') && !iconStr.includes('pi '))
        ) {
          updatedActivity.icon = this.getActivityIcon(updatedActivity);
        }
      }

      return updatedActivity;
    });
  }

  /**
   * Helper to check if an activity represents a delete/remove/archive action.
   */
  private isDeleteActivity(activity: RecentActivity): boolean {
    const action = (activity.action || '').toLowerCase();
    const message = (activity.message || '').toLowerCase();
    const details = (activity.details || '').toLowerCase();
    const type = (activity.type || '').toLowerCase();
    const icon = (activity.icon || '').toLowerCase();

    return (
      action.includes('delete') ||
      action.includes('remove') ||
      message.includes('delete') ||
      message.includes('deleted') ||
      message.includes('remove') ||
      message.includes('removed') ||
      message.includes('archive') ||
      details.includes('delete') ||
      details.includes('deleted') ||
      type === 'danger' ||
      icon.includes('delete') ||
      icon.includes('remove') ||
      icon.includes('trash')
    );
  }

  /**
   * Generates a suitable PrimeIcon class based on the activity details when the icon is missing.
   */
  private getActivityIcon(activity: RecentActivity): string {
    const action = (activity.action || '').toLowerCase();
    const message = (activity.message || '').toLowerCase();
    const details = (activity.details || '').toLowerCase();
    const type = (activity.type || '').toLowerCase();
    const iconStr = String(activity.icon || '').trim().toLowerCase();

    // Direct mapping if the backend sent a simple keyword
    if (iconStr === 'trash' || iconStr === 'delete') return 'pi pi-trash';
    if (iconStr === 'calendar' || iconStr === 'schedule') return 'pi pi-calendar';
    if (iconStr === 'user') return 'pi pi-user';
    if (iconStr === 'pencil' || iconStr === 'edit') return 'pi pi-pencil';
    if (iconStr === 'plus' || iconStr === 'add') return 'pi pi-plus';

    // Delete / Archive / Remove actions
    if (
      action.includes('delete') ||
      action.includes('remove') ||
      message.includes('delete') ||
      message.includes('deleted') ||
      message.includes('remove') ||
      message.includes('removed') ||
      message.includes('archive') ||
      details.includes('delete') ||
      details.includes('deleted') ||
      type === 'danger'
    ) {
      return 'pi pi-trash';
    }

    // Schedule / Reschedule actions
    if (
      action.includes('schedule') ||
      action.includes('reschedule') ||
      message.includes('schedule') ||
      message.includes('scheduled') ||
      message.includes('reschedule') ||
      message.includes('rescheduled') ||
      message.includes('interview') ||
      details.includes('schedule') ||
      details.includes('scheduled') ||
      details.includes('interview')
    ) {
      return 'pi pi-calendar';
    }

    // Edit / Update / Save actions
    if (
      action.includes('update') ||
      action.includes('edit') ||
      message.includes('update') ||
      message.includes('updated') ||
      message.includes('edit') ||
      message.includes('edited') ||
      message.includes('modify') ||
      message.includes('change')
    ) {
      if (message.includes('candidate') || message.includes('user')) {
        return 'pi pi-user-edit';
      }
      return 'pi pi-file-edit';
    }

    // Create / Add actions
    if (
      action.includes('create') ||
      action.includes('add') ||
      message.includes('create') ||
      message.includes('created') ||
      message.includes('add') ||
      message.includes('added') ||
      message.includes('new')
    ) {
      if (message.includes('candidate') || message.includes('user')) {
        return 'pi pi-user-plus';
      }
      if (message.includes('batch')) {
        return 'pi pi-clone';
      }
      return 'pi pi-plus-circle';
    }

    // Success / Verification
    if (type === 'success' || action.includes('success') || action.includes('complete')) {
      return 'pi pi-check-circle';
    }

    // Fallbacks based on keywords or type
    if (message.includes('candidate') || message.includes('user')) {
      return 'pi pi-user';
    }
    if (message.includes('batch')) {
      return 'pi pi-list';
    }
    if (message.includes('recruitment') || message.includes('assessment')) {
      return 'pi pi-briefcase';
    }

    if (type === 'warning') {
      return 'pi pi-exclamation-triangle';
    }

    return 'pi pi-info-circle';
  }
}
