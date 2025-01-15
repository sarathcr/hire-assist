import { Injectable } from '@angular/core';
import { TokenData } from '../models/token-data.models';
import { AppState, initialState } from '../models/app-state.models';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private STORAGE_KEY = 'appState';
  private state = this.getStateFromLocalStorage();
  private stateSource = new BehaviorSubject<AppState>(this.state);
  /** Gets the accessToken and refreshToken */
  public getTokenData(): TokenData {
    return this.state.tokenData;
  }

  // Setters

  public setUser(
    id: string,
    name: string,
    role: string,
    application: string,
    preferedDepartamentId: number
  ) {
    const state = _.cloneDeep(this.state);
    state.userState = { id, name, role, application, preferedDepartamentId };
    this.state = state;
    this.updateStore();
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
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Private
  private getStateFromLocalStorage(): AppState {
    const state = localStorage.getItem(this.STORAGE_KEY);
    return state ? this.getParsedState(state) : initialState;
  }

  private getParsedState(state: string): AppState {
    return JSON.parse(state) as AppState;
  }

  private updateStore() {
    this.stateSource.next(this.state);
    this.saveStateToLocalStorage(this.state);
  }

  private saveStateToLocalStorage(appState: AppState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appState));
  }
}
