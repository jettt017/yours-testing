import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';

export const AUTH_STORAGE_KEY = 'yours.auth.v1';

export interface StoredAccount extends User {
  password?: string;
  created_at?: string;
}

class AuthService {
  private cachedUser: User | null = null;
  private cachedUsersList: StoredAccount[] = [];

  constructor() {
    this.initSession();
  }

  private initSession() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        this.cachedUser = JSON.parse(data);
      }
    } catch {
      this.cachedUser = null;
    }

    if (supabase) {
      // Sync with Supabase Auth state
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          this.syncProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.role,
            session.user.user_metadata?.name
          );
        } else if (!this.cachedUser) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          this.cachedUser = null;
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } else if (session.user) {
          await this.syncProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.role,
            session.user.user_metadata?.name
          );
        }
      });

      // Initial load of profiles for admin
      this.fetchProfiles();
    }
  }

  private async syncProfile(userId: string, email: string, metaRole?: string, metaName?: string): Promise<User | null> {
    if (!supabase) return this.cachedUser;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const role = (profile?.role as UserRole) || (metaRole as UserRole) || 'creator';
      const name = profile?.name || metaName || email.split('@')[0];

      const user: User = {
        id: userId,
        name,
        email: profile?.email || email,
        role,
      };

      this.cachedUser = user;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch {
      return this.cachedUser;
    }
  }

  getCurrentUser(): User | null {
    if (this.cachedUser) return this.cachedUser;
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      this.cachedUser = JSON.parse(data);
      return this.cachedUser;
    } catch {
      return null;
    }
  }

  async login(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();

    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const user = await this.syncProfile(
      data.user.id,
      data.user.email || cleanEmail,
      data.user.user_metadata?.role,
      data.user.user_metadata?.name
    );
    if (!user) {
      throw new Error('Failed to retrieve user profile.');
    }
    return user;
  }

  async register(name: string, email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (pass.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          name: cleanName,
          role: 'creator',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed.');
    }

    // Insert or update profile directly to ensure profile exists immediately
    await supabase.from('profiles').upsert([
      {
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        role: 'creator',
      },
    ]);

    const user: User = {
      id: data.user.id,
      name: cleanName,
      email: cleanEmail,
      role: 'creator',
    };

    this.cachedUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async logout(): Promise<void> {
    this.cachedUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  async fetchProfiles(): Promise<StoredAccount[]> {
    if (!supabase) return this.cachedUsersList;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        this.cachedUsersList = data.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role as UserRole,
          created_at: p.created_at,
        }));
      }
    } catch (e) {
      console.error('Failed to fetch profiles', e);
    }
    return this.cachedUsersList;
  }

  getAllUsers(): StoredAccount[] {
    // Return cached list, and refresh in background
    this.fetchProfiles();
    return this.cachedUsersList;
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    if (!supabase) return false;

    // Call RPC promote_user_role
    const { error: rpcError } = await supabase.rpc('promote_user_role', {
      target_user_id: userId,
      new_role: newRole,
    });

    if (rpcError) {
      console.warn('RPC promote_user_role failed, trying direct update', rpcError);
      const { error: tableError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (tableError) {
        console.error('Failed to update role', tableError);
        return false;
      }
    }

    // Update cache
    const idx = this.cachedUsersList.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      this.cachedUsersList[idx].role = newRole;
    }

    if (this.cachedUser && this.cachedUser.id === userId) {
      this.cachedUser.role = newRole;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.cachedUser));
    }
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!supabase) return false;

    // Try RPC first to delete both from auth.users and profiles
    const { error: rpcError } = await supabase.rpc('delete_user_by_admin', {
      target_user_id: userId,
    });

    if (rpcError) {
      console.warn('RPC delete failed, falling back to direct table delete', rpcError);
      const { error: tableError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (tableError) {
        console.error('Failed to delete profile', tableError);
        return false;
      }
    }

    this.cachedUsersList = this.cachedUsersList.filter((u) => u.id !== userId);
    return true;
  }

  async createUser(name: string, email: string, pass: string, role: UserRole): Promise<StoredAccount> {
    if (!supabase) throw new Error('Supabase client not configured');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (pass.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          name: cleanName,
          role,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to create user.');
    }

    await supabase.from('profiles').upsert([
      {
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        role,
      },
    ]);

    const newAccount: StoredAccount = {
      id: data.user.id,
      name: cleanName,
      email: cleanEmail,
      role,
    };

    this.cachedUsersList.unshift(newAccount);
    return newAccount;
  }
}

export const authService = new AuthService();
