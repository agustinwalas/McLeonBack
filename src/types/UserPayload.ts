export interface UserPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  isAdmin: boolean;
}
