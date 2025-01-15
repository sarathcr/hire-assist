import { initialTokenData, TokenData } from './token-data.models';
import { initialUserState, UserState } from './user.model';

// APP STATE
export interface AppState {
  isLoading: boolean;
  tokenData: TokenData;
  userState: UserState;
}

export const initialState: AppState = {
  isLoading: false,
  tokenData: initialTokenData,
  userState: initialUserState,
};
