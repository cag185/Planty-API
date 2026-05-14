export interface User {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  name: string;
  email: string;
  password: string;
}
