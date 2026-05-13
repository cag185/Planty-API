export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  id: number;
  name?: string;
  email?: string;
  password?: string;
}

export interface DeleteUserRequest {
  id: number;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}
