import { Injectable } from '@angular/core';
import { TokenData } from '../models/token-data.models';
import { AppState, initialState } from '../models/app-state.models';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import * as _ from 'lodash';
import { RolesEnum } from '../enum/enum';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private STORAGE_KEY = 'appState';
  private state = this.getStateFromLocalStorage();
  private stateSource = new BehaviorSubject<AppState>(this.state);
  public state$ = this.stateSource.asObservable();

  /** Gets the accessToken and refreshToken */
  public getTokenData(): TokenData {
    return this.state.tokenData;
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
        .map(roleValue => RolesEnum[roleValue] as string) // Map numeric values to role names
        .filter(roleName => roleName) // Remove undefined/null values
        .map(roleName => roleName.toLowerCase()); // Convert to lowercase

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
      map(state => state.isLoading),
      distinctUntilChanged()
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
    return JSON.parse(state) as AppState;
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
}
