export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export const initialTokenData: TokenData = {
  accessToken: '',
  refreshToken: '',
};
