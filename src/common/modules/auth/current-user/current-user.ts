import { Role } from '../roles.eum';

export class UserDetails {
  uid: string;
  email: string;
  roles: Role[];
  regions: number[];
  phone: string;
}
