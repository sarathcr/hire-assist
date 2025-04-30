export enum TokenField {
  // UserId = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid',
  // UserName = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  // Role = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  // Expiration = 'exp',
  // PreferedDepartamentId = 'DepartmentId',
  // PersonName = 'PersonName',
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

// export const Application = 'Comercial';

export const isTokenExpired = (token: string): boolean => {
  const exp = token ? +getTokenPayloadData(token, TokenField.Expiration) : 0;
  return Math.floor(new Date().getTime() / 1000) >= exp;
};

//   token: string,
//   keyAccessor: TokenField
// ): string => {
//   if (!token) {
//     return '';
//   }

//   try {
//     const base64Url = token.split('.')[1]; // Get the payload part of the JWT
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace Base64Url characters
//     const jsonPayload = decodeURIComponent(
//       Array.prototype.map
//         .call(window && window.atob(base64), c => {
//           return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         })
//         .join('')
//     );
//     const parsedPayload = JSON.parse(jsonPayload); // Parse the payload as JSON

//     return parsedPayload[keyAccessor]; // Return the desired field
//   } catch (error) {
//     console.error('Error decoding token payload:', error);
//     return '';
//   }
// };
export const getTokenPayloadData = (
  token: string,
  keyAccessor: TokenField,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (!token) {
    return null;
  }

  try {
    const base64Url = token.split('.')[1]; // Get the payload part of the JWT
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace Base64Url characters
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(window && window.atob(base64), (c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    const parsedPayload = JSON.parse(jsonPayload); // Parse the payload as JSON

    const value = parsedPayload[keyAccessor];
    // Handle JSON-encoded fields, e.g., UserRoles
    if (keyAccessor === TokenField.Role && typeof value === 'string') {
      try {
        return JSON.parse(value); // Parse UserRoles as JSON if it's a string
      } catch {
        console.warn('Unable to parse UserRoles as JSON:', value);
        return value; // Return as-is if parsing fails
      }
    }

    return value; // Return the desired field
  } catch (error) {
    console.error('Error decoding token payload:', error);
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
