export {};

declare global {
  namespace Express {
    interface Request {
      admin?: {
        role: "ADMIN";
        operatorName: string;
      };
    }
  }
}
