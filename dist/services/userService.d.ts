import { User } from "../models";
import { CreateUserRequest, UpdateUserRequest, DeleteUserRequest, LoginUserRequest } from "../requests";
export interface LoginResult {
    token: string;
    user: Omit<User, "password">;
}
export declare const getAllUsers: () => Promise<User[]>;
export declare const getUserById: (id: number) => Promise<User | null>;
export declare const getUserByEmail: (email: string) => Promise<User | null>;
export declare const loginUser: (req: LoginUserRequest) => Promise<LoginResult>;
export declare const createUser: (req: CreateUserRequest) => Promise<Omit<User, "password">>;
export declare const updateUser: (req: UpdateUserRequest) => Promise<boolean>;
export declare const deleteUser: (req: DeleteUserRequest) => Promise<boolean>;
