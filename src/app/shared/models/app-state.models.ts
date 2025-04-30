import { initialTokenData, TokenData } from './token-data.models';
import { initialUserState, UserState } from './user.models';

// APP STATE
export interface AppState {
  isLoading: boolean;
  tokenData: TokenData;
  userState: UserState;
  collection: Option[];
}

export const initialState: AppState = {
  isLoading: false,
  tokenData: initialTokenData,
  userState: initialUserState,
  collection: [],
};

export interface Option {
  id: number;
  name: string;
  code?: string;
  children?: Option[];
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface OptionsMap {
  [key: string]: Option[];
}

export type { UserState };
