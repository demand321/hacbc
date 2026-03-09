import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    memberStatus: string;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      memberStatus: string;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    memberStatus: string;
    mustChangePassword: boolean;
  }
}
