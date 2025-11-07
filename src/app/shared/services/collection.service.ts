import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StoreService } from './store.service';
import { Option, OptionsMap } from '../models/app-state.models';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  constructor(
    private readonly http: HttpClient,
    private readonly storeService: StoreService,
  ) {}

  private readonly collectionUrl = environment.collectionUrl;

  public getCollection() {
    const url = `${this.collectionUrl}/api/collection`;

    this.http.get<OptionsMap>(url).subscribe((collection) => {
      if (!collection) {
        return;
      }

      this.storeService.setCollection(collection);
    });
  }

  public updateCollection(key: string, data: { id: number; title: string }) {
    const currentCollection: OptionsMap =
      this.storeService.getCollection() || {};

    const newItem: Option = { value: data.id.toString(), label: data.title };

    const existingItems = currentCollection[key] || [];
    const newItems = [...existingItems, newItem];
    const updatedCollection = { ...currentCollection, [key]: newItems };

    this.storeService.setCollection(updatedCollection);
  }

  public deleteItemFromCollection(key: string, id: number) {
    const currentCollection: OptionsMap =
      this.storeService.getCollection() || {};
    const updatedItems = currentCollection[key].filter(
      (item) => item.value !== id.toString(),
    );

    const updatedCollection = { ...currentCollection, [key]: updatedItems };
    this.storeService.setCollection(updatedCollection);
  }
}
