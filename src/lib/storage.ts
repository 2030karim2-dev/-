export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },
  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },
  setUser: (user: any): void => {
    localStorage.setItem('user_data', JSON.stringify(user));
  },
  getUser: (): any | null => {
    const user = localStorage.getItem('user_data');
    return user ? JSON.parse(user) : null;
  }
};