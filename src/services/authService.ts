import { User } from '../types';

export const AUTH_STORAGE_KEY = 'yours.auth.v1';

export interface StoredAccount extends User {
  password: string;
}

// Hardcoded users database
export const MOCK_USERS: StoredAccount[] = [
  {
    id: 'usr_creator_01',
    name: 'Rani Wulandari',
    email: 'rani@example.com',
    password: 'user123',
    role: 'creator',
  },
  {
    id: 'usr_creator_demo',
    name: 'Creator Demo',
    email: 'creator@example.com',
    password: 'user123',
    role: 'creator',
  },
  {
    id: 'usr_admin_01',
    name: 'Lead Curator',
    email: 'admin@yours.editorial',
    password: 'admin123',
    role: 'admin',
  },
];

class AuthService {
  private getAccounts(): StoredAccount[] {
    try {
      const data = localStorage.getItem('yours.users.v1');
      if (!data) {
        localStorage.setItem('yours.users.v1', JSON.stringify(MOCK_USERS));
        return MOCK_USERS;
      }
      return JSON.parse(data);
    } catch {
      return MOCK_USERS;
    }
  }

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async login(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();

    const match = accounts.find(
      (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === pass
    );

    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const user: User = {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async register(name: string, email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();

    if (accounts.some((acc) => acc.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: StoredAccount = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: pass,
      role: 'creator',
    };

    accounts.push(newUser);
    localStorage.setItem('yours.users.v1', JSON.stringify(accounts));

    const user: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  quickLogin(role: 'creator' | 'admin'): User {
    const target =
      role === 'admin'
        ? MOCK_USERS.find((u) => u.role === 'admin')!
        : MOCK_USERS.find((u) => u.email === 'rani@example.com')!;

    const user: User = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  getAllUsers(): StoredAccount[] {
    return this.getAccounts();
  }

  updateUserRole(userId: string, newRole: User['role']): boolean {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    accounts[idx].role = newRole;
    localStorage.setItem('yours.users.v1', JSON.stringify(accounts));

    // If updating current logged in user
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.role = newRole;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(current));
    }
    return true;
  }

  deleteUser(userId: string): boolean {
    const accounts = this.getAccounts();
    const filtered = accounts.filter((u) => u.id !== userId);
    if (filtered.length === accounts.length) return false;
    localStorage.setItem('yours.users.v1', JSON.stringify(filtered));
    return true;
  }

  createUser(name: string, email: string, pass: string, role: User['role']): StoredAccount {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();

    if (accounts.some((acc) => acc.email.toLowerCase() === cleanEmail)) {
      throw new Error('User with this email already exists.');
    }

    const newUser: StoredAccount = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: pass,
      role: role,
    };

    accounts.push(newUser);
    localStorage.setItem('yours.users.v1', JSON.stringify(accounts));
    return newUser;
  }
}

export const authService = new AuthService();
