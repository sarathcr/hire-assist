export enum TokenField {
  UserId = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid',
  UserName = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  Role = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  Expiration = 'exp',
  PreferedDepartamentId = 'DepartmentId',
  PersonName = 'PersonName',
}

export interface CheckAppAndRoleOutput {
  authoirsedUser: boolean;
  role: string;
  application: string;
}

export const Application = 'Comercial';

export const isTokenExpired = (token: string): boolean => {
  const exp = token ? +getTokenPayloadData(token, TokenField.Expiration) : 0;
  return Math.floor(new Date().getTime() / 1000) >= exp;
};

export const getTokenPayloadData = (
  token: string,
  keyAccessor: TokenField
): string => {
  if (!token) {
    return '';
  }

  try {
    const base64Url = token.split('.')[1]; // Get the payload part of the JWT
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace Base64Url characters
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(window && window.atob(base64), c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const parsedPayload = JSON.parse(jsonPayload); // Parse the payload as JSON

    return parsedPayload[keyAccessor]; // Return the desired field
  } catch (error) {
    console.error('Error decoding token payload:', error);
    return '';
  }
};

export const getTokenNumericPayloadData = (
  token: string,
  keyAccessor: TokenField
): number => {
  return token
    ? JSON.parse(window && window.atob(token.split('.')[1]))[keyAccessor]
    : 0;
};

export const checkAppAndRole = (data: string[]): CheckAppAndRoleOutput => {
  const appData = data?.filter(item => item.includes(Application));

  if (appData?.length > 0) {
    return {
      authoirsedUser: true,
      role: appData[appData.length - 1].split('-')[1],
      application: Application,
    };
  }
  return {
    authoirsedUser: false,
    role: '',
    application: '',
  };
};
