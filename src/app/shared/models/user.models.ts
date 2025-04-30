export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  CANDIDATE = 'Candidate',
  INTERVIEWER = 'Interviewer',
  NULL = '',
}
export interface UserState {
  id: string;
  name: string;
  // expiration?: number;
  //   preferedLang: Lang;
  role: string;
  // preferedDepartamentId: number;
  // application?: string;
}
export const initialUserState: UserState = {
  id: '',
  name: '',
  // expiration: 0,
  //   preferedLang: Lang.Spanish,
  role: UserRole.NULL,
  // preferedDepartamentId: 0,
  // application: '',
};
