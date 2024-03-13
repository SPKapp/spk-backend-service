import { Role } from '../roles.eum';

export class UserDetails {
  uid: string;
  email: string;
  phone: string;
  roles: Role[];
  regions?: number[];
  teamId?: number;
}
