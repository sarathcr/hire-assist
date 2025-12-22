import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, interval, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreService } from './store.service';
import { Option, OptionsMap } from '../models/app-state.models';

@Injectable({
  providedIn: 'root',
})
export class CollectionService implements OnDestroy {
  private readonly COLLECTION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly COLLECTION_STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
  private readonly COLLECTION_TIMESTAMP_KEY = 'collectionLastFetched';
  
  private refreshSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private visibilitySubscription?: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly storeService: StoreService,
    private readonly router: Router,
  ) {
    this.setupAutoRefresh();
    this.setupVisibilityRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
    }
  }

  private setupAutoRefresh(): void {
    // Refresh collections periodically
    this.refreshSubscription = interval(this.COLLECTION_REFRESH_INTERVAL).subscribe(() => {
      if (this.shouldRefreshCollections()) {
        this.getCollection(true);
      }
    });

    // Refresh collections on route navigation to dashboard/main pages
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).url;
        // Refresh on navigation to main dashboard pages
        if (
          url.includes('/admin') ||
          url.includes('/coordinator') ||
          url.includes('/frontdesk') ||
          url.includes('/interviewer')
        ) {
          if (this.shouldRefreshCollections()) {
            this.getCollection(true);
          }
        }
      });
  }

  private setupVisibilityRefresh(): void {
    // Refresh when tab/window becomes visible (user switches back to the app)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.shouldRefreshCollections()) {
          this.getCollection(true);
        }
      });
    }
  }

  public shouldRefreshCollections(): boolean {
    if (!this.storeService.isAuthenticated()) {
      return false;
    }

    const lastFetched = this.getLastFetchedTimestamp();
    if (!lastFetched) {
      return true; // Never fetched, should fetch
    }

    const timeSinceLastFetch = Date.now() - lastFetched;
    return timeSinceLastFetch > this.COLLECTION_STALE_THRESHOLD;
  }

  private getLastFetchedTimestamp(): number | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const timestamp = localStorage.getItem(this.COLLECTION_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  private setLastFetchedTimestamp(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.COLLECTION_TIMESTAMP_KEY, Date.now().toString());
    }
  }

  public getCollection(silent = false) {
    const url = `${this.collectionUrl}/api/collection`;

    this.http.get<OptionsMap>(url).subscribe({
      next: (collection) => {
        if (!collection) {
          return;
        }

        this.storeService.setCollection(collection);
        this.setLastFetchedTimestamp();
      },
      error: (error) => {
        if (!silent) {
          console.error('Failed to fetch collections:', error);
        }
      },
    });
  }

  /**
   * Force refresh collections from server (ignores stale threshold)
   * Useful when you know collections have been updated on another device
   */
  public forceRefreshCollections(): void {
    this.getCollection(true);
  }

  private get collectionUrl(): string {
    return environment.collectionUrl;
  }

  public updateCollection(key: string, data: { id: number; title: string }) {
    const currentCollection: OptionsMap =
      this.storeService.getCollection() || {};

    const newItem: Option = { value: data.id.toString(), label: data.title };

    const existingItems = currentCollection[key] || [];

    const existingItem = existingItems.find(
      (item) => item.value === newItem.value,
    );

    const updatedItems = existingItem
      ? existingItems.map((item) =>
          item.value === newItem.value ? newItem : item,
        )
      : [...existingItems, newItem];
    const updatedCollection = { ...currentCollection, [key]: updatedItems };

    this.storeService.setCollection(updatedCollection);
  }

  public deleteItemFromCollection(key: string, id: number | string) {
    const currentCollection: OptionsMap =
      this.storeService.getCollection() || {};
    const updatedItems = currentCollection[key].filter(
      (item) => item.value !== id.toString(),
    );

    const updatedCollection = { ...currentCollection, [key]: updatedItems };
    this.storeService.setCollection(updatedCollection);
  }
}
