export enum RoleName {
  INVITADA = 1,
  TRAMITADORA = 2,
  TRAMITADORA_AVANZADA = 3,
  RESPONSABLE = 4,
  DIRECTORA = 5,
}

export enum PermissionName {
  LECTURA = 'LECTURA',
  LECTURA_MODIFICACION = 'LECTURA_MODIFICACION',
  LECTURA_MODIFICACION_CREACION = 'LECTURA_MODIFICACION_CREACION',
  ACCESO_COMPLETO = 'ACCESO_COMPLETO',
}

export const allowedToEditPermissions = [
  PermissionName.LECTURA_MODIFICACION,
  PermissionName.LECTURA_MODIFICACION_CREACION,
  PermissionName.ACCESO_COMPLETO,
];

export interface SpecialPermission {
  id: string;
  permissionName: PermissionName;
}

export interface Permission {
  roleId: number;
  roleName: RoleName;
  functionalityId: number;
  functionalityName: string;
  permissionId: number;
  permissionName: PermissionName;
  specialPermissions: SpecialPermission[];
}
