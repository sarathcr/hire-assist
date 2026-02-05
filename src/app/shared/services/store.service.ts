import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { RolesEnum } from '../enums/enum';
import {
  AppState,
  initialState,
  OptionsMap,
  UserState,
} from '../models/app-state.models';
import { TokenData } from '../models/token-data.models';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private STORAGE_KEY = 'appState';
  private state = this.getStateFromLocalStorage();
  public stateSource = new BehaviorSubject<AppState>(this.state);
  public state$ = this.stateSource.asObservable();

  /** Gets the accessToken and refreshToken */
  public getTokenData(): TokenData {
    return this.state.tokenData;
  }

  public getUserData(): UserState {
    return this.state.userState;
  }

  /** Checks if the user is authenticated with a token */
  public isAuthenticated(): boolean {
    const { accessToken } = this.getTokenData();
    return !!accessToken;
  }

  // Get role from local storage
  public getUserRole(): string[] | null {
    const state = this.getStateFromLocalStorage();
    const roles = state?.userState?.role;

    if (Array.isArray(roles) && roles.length > 0) {
      const roleNames = roles
        .map((roleValue) => RolesEnum[roleValue] as string) // Map numeric values to role names
        .filter((roleName) => roleName) // Remove undefined/null values
        .map((roleName) => roleName.toLowerCase()); // Convert to lowercase

      return roleNames;
    }

    return null;
  }

  // Setters
  public setUser(id: string, name: string, role: string) {
    const state = _.cloneDeep(this.state);
    state.userState = { id, name, role };
    this.state = state;
    this.updateStore();
  }

  public selectIsLoading(): Observable<boolean> {
    return this.state$.pipe(
      map((state) => state.isLoading),
      distinctUntilChanged(),
    );
  }

  public setIsLoading(isLoading: boolean) {
    this.state = { ...this.state, isLoading };
    this.updateStore();
  }

  public setTokenData(tokenData: TokenData) {
    const state = _.cloneDeep(this.state);
    state.tokenData = tokenData;
    this.state = state;
    this.updateStore();
  }

  public setAccessTokenData(accessToken: string) {
    const state = _.cloneDeep(this.state);
    state.tokenData.accessToken = accessToken;
    this.state = state;
    this.updateStore();
  }

  public reset() {
    this.state = initialState;
    if (this.isBrowserEnvironment()) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Private
  private getStateFromLocalStorage(): AppState {
    if (this.isBrowserEnvironment()) {
      const state = localStorage.getItem(this.STORAGE_KEY);
      return state ? this.getParsedState(state) : initialState;
    }
    return initialState;
  }

  private getParsedState(state: string): AppState {
    const parsedState = JSON.parse(state) as AppState;
    if (parsedState.userState) {
      parsedState.userState.profileImageUrl = undefined;
    }
    return parsedState;
  }

  private updateStore() {
    this.stateSource.next(this.state);
    if (this.isBrowserEnvironment()) {
      this.saveStateToLocalStorage(this.state);
    }
  }

  private saveStateToLocalStorage(appState: AppState): void {
    if (this.isBrowserEnvironment()) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appState));
    }
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public setCollection(collection: OptionsMap) {
    this.state = { ...this.state, collection }; // Update state
    this.updateStore(); // Save to local storage
  }

  public getCollection(): OptionsMap {
    return this.state.collection;
  }

  public setProfileImageUrl(profileImageUrl: string): void {
    const state = _.cloneDeep(this.state);
    state.userState.profileImageUrl = profileImageUrl;
    this.state = state;
    this.updateStore();
  }

  public getProfileImageUrl(): string | undefined {
    return this.state.userState.profileImageUrl;
  }

  public setIsLoadingProfileImage(isLoading: boolean): void {
    const state = _.cloneDeep(this.state);
    state.userState.isLoadingProfileImage = isLoading;
    this.state = state;
    this.updateStore();
  }

  public getIsLoadingProfileImage(): boolean {
    return this.state.userState.isLoadingProfileImage || false;
  }

  private _isProfileDetailsLoading = false;

  public get isProfileDetailsLoading(): boolean {
    return this._isProfileDetailsLoading;
  }

  public setIsProfileDetailsLoading(value: boolean): void {
    this._isProfileDetailsLoading = value;
  }
}
