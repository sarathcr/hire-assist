import { TokenData } from './token-data.model';

export interface LoginResponse {
  data: TokenData;
  errors: string[];
  succeeded: boolean;
}
