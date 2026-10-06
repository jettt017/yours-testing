import { supabase } from './supabaseClient';

export const DEFAULT_CATEGORIES: string[] = [
  'Seni Rupa',
  'Terapan',
  'Kriya',
  'Fotografi',
  'Tari',
  'Musik',
  'Teater',
  'Digital Art',
];

const CATEGORIES_STORAGE_KEY = 'yours.categories.v1';
const CATEGORY_UPDATE_EVENT = 'yours:categories-updated';

class CategoryService {
  private categories: string[] = DEFAULT_CATEGORIES;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
        }
      }
    } catch {
      this.categories = DEFAULT_CATEGORIES;
    }

    if (supabase) {
      await this.fetchFromSupabase();
    }
  }

  async fetchFromSupabase(): Promise<string[]> {
    if (!supabase) return this.categories;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        this.categories = data.map((item) => item.name);
        this.save(this.categories);
      }
    } catch (err) {
      console.warn('Failed to fetch categories from Supabase', err);
    }
    return this.categories;
  }

  getCategories(): string[] {
    return this.categories;
  }

  addCategory(name: string): { success: boolean; error?: string; categories: string[] } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be empty.', categories: this.getCategories() };
    }

    const current = this.getCategories();
    const isDuplicate = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      return { success: false, error: `Category "${trimmed}" already exists.`, categories: current };
    }

    const updated = [...current, trimmed];
    this.save(updated);

    if (supabase) {
      supabase.from('categories').insert([{ name: trimmed }]).then(({ error }) => {
        if (error) console.error('Failed to add category to Supabase', error);
      });
    }

    return { success: true, categories: updated };
  }

  renameCategory(oldName: string, newName: string): { success: boolean; error?: string; categories: string[] } {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be empty.', categories: this.getCategories() };
    }

    const current = this.getCategories();
    const isDuplicate = current.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, error: `Category "${trimmed}" already exists.`, categories: current };
    }

    const updated = current.map((c) => (c.toLowerCase() === oldName.toLowerCase() ? trimmed : c));
    this.save(updated);

    if (supabase) {
      supabase.from('categories').update({ name: trimmed }).eq('name', oldName).then(({ error }) => {
        if (error) console.error('Failed to rename category in Supabase', error);
      });
    }

    return { success: true, categories: updated };
  }

  deleteCategory(name: string): { success: boolean; error?: string; categories: string[] } {
    const current = this.getCategories();
    if (current.length <= 1) {
      return { success: false, error: 'At least 1 active category is required.', categories: current };
    }

    const updated = current.filter((c) => c.toLowerCase() !== name.toLowerCase());
    this.save(updated);

    if (supabase) {
      supabase.from('categories').delete().eq('name', name).then(({ error }) => {
        if (error) console.error('Failed to delete category in Supabase', error);
      });
    }

    return { success: true, categories: updated };
  }

  resetToDefault(): string[] {
    this.save(DEFAULT_CATEGORIES);
    if (supabase) {
      const client = supabase;
      client.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {
        client.from('categories').insert(DEFAULT_CATEGORIES.map((name) => ({ name })));
      });
    }
    return DEFAULT_CATEGORIES;
  }

  private save(categories: string[]): void {
    this.categories = categories;
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent(CATEGORY_UPDATE_EVENT, { detail: categories }));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }

  subscribe(callback: (categories: string[]) => void): () => void {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      callback(custom.detail || this.getCategories());
    };
    window.addEventListener(CATEGORY_UPDATE_EVENT, handler);
    return () => window.removeEventListener(CATEGORY_UPDATE_EVENT, handler);
  }
}

export const categoryService = new CategoryService();
