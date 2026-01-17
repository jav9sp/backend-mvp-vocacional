export type SafeUser = {
  id: number;
  rut: string;
  organizationId: number;
  name: string;
  email: string;
  mustChangePassword: boolean;
};
