export enum TokenField {
  Name = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  Emailaddress = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  Role = 'UserRoles',
  Expiration = 'exp',
}

export interface CheckAppAndRoleOutput {
  authoirsedUser: boolean;
  role: string;
  application: string;
}

export const isTokenExpired = (token: string): boolean => {
  const exp = token ? +getTokenPayloadData(token, TokenField.Expiration) : 0;
  return Math.floor(new Date().getTime() / 1000) >= exp;
};

export const getTokenPayloadData = (
  token: string,
  keyAccessor: TokenField,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (!token) {
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(window && window.atob(base64), (c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    const parsedPayload = JSON.parse(jsonPayload);

    const value = parsedPayload[keyAccessor];
    if (keyAccessor === TokenField.Role && typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  } catch {
    return null;
  }
};

export const getTokenNumericPayloadData = (
  token: string,
  keyAccessor: TokenField,
): number => {
  return token
    ? JSON.parse(window && window.atob(token.split('.')[1]))[keyAccessor]
    : 0;
};
