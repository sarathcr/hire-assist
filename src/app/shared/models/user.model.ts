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
  //   preferedLang: Lang;
  role: string;
  preferedDepartamentId: number;
  application?: string;
}
export const initialUserState: UserState = {
  id: '',
  name: '',
  //   preferedLang: Lang.Spanish,
  role: UserRole.NULL,
  preferedDepartamentId: 0,
  application: '',
};
