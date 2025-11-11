export enum Rol {
  Administrador = 'Administrador',
  Usuario = 'Usuario',
  Visor = 'Visor'
}

export interface Usuario {
  id?: number;
  username: string;
  password?: string; // Solo para creación/actualización, no se envía en respuestas
  rol: Rol;
  activo?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  usuario: Usuario;
  requiresPasswordChange?: boolean;
}

