import { Submission, SubmissionStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const STORAGE_KEY = 'yours.subs.v1';

export const SEED_DATA: Submission[] = [
  {
    id: '#ART-2026-10482',
    name: 'Rani Wulandari',
    email: 'rani@example.com',
    wa: '+6281234567890',
    inst: 'ISI Yogyakarta',
    city: 'Yogyakarta',
    portfolio: 'https://behance.net/raniwulandari',
    title: 'Benang Merah',
    year: '2026',
    medium: 'Textile installation',
    desc: 'Red thread across 40 meters of village memory, exploring domestic labor and communal grief.',
    cat: 'Kriya',
    link: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz-demo1',
    status: 'review',
    note: '',
    date: '2026-09-12',
  },
  {
    id: '#ART-2026-20931',
    name: 'Bimo Aditya',
    email: 'bimo@example.com',
    wa: '+6285711112222',
    inst: 'ITS',
    city: 'Surabaya',
    portfolio: 'https://bimo.art',
    title: 'Static Garden',
    year: '2025',
    medium: 'Generative video',
    desc: 'A garden grown from sensor noise and environmental electromagnetic interference over 30 days.',
    cat: 'Digital Art',
    link: 'https://drive.google.com/drive/folders/1XyZ-987654321-demo2',
    status: 'revision',
    note: 'Please upload the full-length cut and set the Drive link to public.',
    date: '2026-09-18',
  },
  {
    id: '#ART-2026-30517',
    name: 'Sekar Ayu',
    email: 'sekar@example.com',
    wa: '+6281399990000',
    inst: 'ISBI Bandung',
    city: 'Bandung',
    portfolio: '',
    title: 'Gerak Pagi',
    year: '2026',
    medium: 'Contemporary dance, 8 min',
    desc: 'Morning commute choreographed as ritual and survival in high-density urban transit nodes.',
    cat: 'Tari',
    link: 'https://drive.google.com/drive/folders/1Qwerty-555666777-demo3',
    status: 'pending',
    note: '',
    date: '2026-09-30',
  },
];

export interface ISubmissionRepository {
  getAll(): Promise<Submission[]>;
  findByIdAndEmail(id: string, email: string): Promise<Submission | null>;
  create(submission: Omit<Submission, 'id' | 'status' | 'note' | 'date'>): Promise<Submission>;
  updateStatus(id: string, status: SubmissionStatus, note?: string): Promise<Submission>;
  resetToSeed(): Promise<Submission[]>;
  renameCategory(oldCat: string, newCat: string): Promise<void>;
}

export class LocalStorageSubmissionRepository implements ISubmissionRepository {
  private getRawSubmissions(): Submission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveRawSubmissions(SEED_DATA);
        return [...SEED_DATA];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      this.saveRawSubmissions(SEED_DATA);
      return [...SEED_DATA];
    } catch {
      return [...SEED_DATA];
    }
  }

  private saveRawSubmissions(items: Submission[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  async getAll(): Promise<Submission[]> {
    return this.getRawSubmissions();
  }

  async findByIdAndEmail(id: string, email: string): Promise<Submission | null> {
    const cleanId = id.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const subs = this.getRawSubmissions();

    const match = subs.find(
      (s) =>
        s.id.trim().toLowerCase() === cleanId &&
        s.email.trim().toLowerCase() === cleanEmail
    );

    return match || null;
  }

  async create(data: Omit<Submission, 'id' | 'status' | 'note' | 'date'>): Promise<Submission> {
    const subs = this.getRawSubmissions();

    // Generate unique ID: "#ART-2026-" + 5 random digits (10000-99999)
    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      newId = `#ART-2026-${randomNum}`;
      if (!subs.some((s) => s.id === newId)) {
        isUnique = true;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const newSubmission: Submission = {
      ...data,
      id: newId,
      status: 'pending',
      note: '',
      date: today,
    };

    subs.unshift(newSubmission);
    this.saveRawSubmissions(subs);
    return newSubmission;
  }

  async updateStatus(id: string, status: SubmissionStatus, note?: string): Promise<Submission> {
    const subs = this.getRawSubmissions();
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Submission ${id} not found.`);
    }

    const updated: Submission = {
      ...subs[index],
      status,
      note: status === 'revision' ? (note ?? subs[index].note) : subs[index].note,
    };

    subs[index] = updated;
    this.saveRawSubmissions(subs);
    return updated;
  }

  async resetToSeed(): Promise<Submission[]> {
    this.saveRawSubmissions(SEED_DATA);
    return [...SEED_DATA];
  }

  async renameCategory(oldCat: string, newCat: string): Promise<void> {
    const subs = this.getRawSubmissions();
    const updated = subs.map((s) => {
      if (s.cat.toLowerCase() === oldCat.toLowerCase()) {
        return { ...s, cat: newCat };
      }
      return s;
    });
    this.saveRawSubmissions(updated);
  }
}

export class SupabaseSubmissionRepository implements ISubmissionRepository {
  async getAll(): Promise<Submission[]> {
    if (!supabase) return new LocalStorageSubmissionRepository().getAll();
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed, falling back to local storage', error);
      return new LocalStorageSubmissionRepository().getAll();
    }
    return data as Submission[];
  }

  async findByIdAndEmail(id: string, email: string): Promise<Submission | null> {
    if (!supabase) return new LocalStorageSubmissionRepository().findByIdAndEmail(id, email);
    const cleanId = id.trim();
    const cleanEmail = email.trim();

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .ilike('id', cleanId)
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      // Fallback check
      return new LocalStorageSubmissionRepository().findByIdAndEmail(id, email);
    }
    return data as Submission;
  }

  async create(data: Omit<Submission, 'id' | 'status' | 'note' | 'date'>): Promise<Submission> {
    if (!supabase) return new LocalStorageSubmissionRepository().create(data);

    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      newId = `#ART-2026-${randomNum}`;
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('id', newId)
        .maybeSingle();
      if (!existing) isUnique = true;
    }

    const today = new Date().toISOString().slice(0, 10);
    const record: Submission = {
      ...data,
      id: newId,
      status: 'pending',
      note: '',
      date: today,
    };

    const { error } = await supabase.from('submissions').insert([record]);
    if (error) {
      console.warn('Supabase insert failed, saving to local storage fallback', error);
      return new LocalStorageSubmissionRepository().create(data);
    }
    return record;
  }

  async updateStatus(id: string, status: SubmissionStatus, note?: string): Promise<Submission> {
    if (!supabase) return new LocalStorageSubmissionRepository().updateStatus(id, status, note);

    const updatePayload: Partial<Submission> = { status };
    if (status === 'revision' && note !== undefined) {
      updatePayload.note = note;
    }

    const { data, error } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('Supabase update failed, updating local storage fallback', error);
      return new LocalStorageSubmissionRepository().updateStatus(id, status, note);
    }
    return data as Submission;
  }

  async resetToSeed(): Promise<Submission[]> {
    if (!supabase) return new LocalStorageSubmissionRepository().resetToSeed();
    await supabase.from('submissions').delete().neq('id', '');
    await supabase.from('submissions').insert(SEED_DATA);
    return [...SEED_DATA];
  }

  async renameCategory(oldCat: string, newCat: string): Promise<void> {
    if (!supabase) return new LocalStorageSubmissionRepository().renameCategory(oldCat, newCat);
    await supabase.from('submissions').update({ cat: newCat }).ilike('cat', oldCat);
  }
}

// Factory that chooses Supabase if configured, otherwise LocalStorage
export function getSubmissionRepository(): ISubmissionRepository {
  if (isSupabaseConfigured) {
    return new SupabaseSubmissionRepository();
  }
  return new LocalStorageSubmissionRepository();
}
