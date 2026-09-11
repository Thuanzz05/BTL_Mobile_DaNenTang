export { };

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        vai_tro: 'user' | 'admin';
      };
    }
  }
}
