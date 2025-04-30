export enum PageLayout {
  DashBoard = 'dashboard', // Key for dashboard layout
  AuthLayout = 'authLayout',
  FullScreen = 'fullscreen', // Key for fullscreen layout
  Admin = 'adminLayout',
  // UnAuthorized = 'unauthorized', // Key for unauthorized layout
  // Error = 'error' // Key for error layout
}

export enum RolesEnum {
  User = 1,
  SuperAdmin = 2,
  Admin = 3,
  Interviewer = 4,
  Candidate = 5,
}

export enum RoleStateEnum {
  Admin = 'admin',
  SuperAdmin = 'superAdmin',
  User = 'user',
  Interviewer = 'interviewer',
  Candidate = 'candidate',
}

export enum ButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
}

export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}
