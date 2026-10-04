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
  getCategories(): string[] {
    try {
      const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
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
    return { success: true, categories: updated };
  }

  deleteCategory(name: string): { success: boolean; error?: string; categories: string[] } {
    const current = this.getCategories();
    if (current.length <= 1) {
      return { success: false, error: 'At least 1 active category is required.', categories: current };
    }

    const updated = current.filter((c) => c.toLowerCase() !== name.toLowerCase());
    this.save(updated);
    return { success: true, categories: updated };
  }

  resetToDefault(): string[] {
    this.save(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }

  private save(categories: string[]): void {
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
