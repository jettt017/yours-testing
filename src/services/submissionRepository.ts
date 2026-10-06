import { Submission, SubmissionStatus } from '../types';
import { supabase } from './supabaseClient';
import { authService } from './authService';

export interface ISubmissionRepository {
  getAll(): Promise<Submission[]>;
  findByIdAndEmail(id: string, email: string): Promise<Submission | null>;
  create(submission: Omit<Submission, 'id' | 'status' | 'note' | 'date'>): Promise<Submission>;
  updateStatus(id: string, status: SubmissionStatus, note?: string): Promise<Submission>;
  resetToSeed(): Promise<Submission[]>;
  renameCategory(oldCat: string, newCat: string): Promise<void>;
}

export class SupabaseSubmissionRepository implements ISubmissionRepository {
  async getAll(): Promise<Submission[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch failed:', error);
      return [];
    }
    return (data || []) as Submission[];
  }

  async findByIdAndEmail(id: string, email: string): Promise<Submission | null> {
    if (!supabase) return null;

    const cleanId = id.trim();
    const cleanEmail = email.trim();

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .ilike('id', cleanId)
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Submission;
  }

  async create(data: Omit<Submission, 'id' | 'status' | 'note' | 'date'>): Promise<Submission> {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    // Generate unique ID: "#ART-2026-" + 5 random digits (10000-99999)
    let newId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      newId = `#ART-2026-${randomNum}`;
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('id', newId)
        .maybeSingle();
      if (!existing) isUnique = true;
    }

    const currentUser = authService.getCurrentUser();
    const today = new Date().toISOString().slice(0, 10);

    const record = {
      ...data,
      id: newId,
      user_id: currentUser ? currentUser.id : null,
      status: 'pending' as SubmissionStatus,
      note: '',
      date: today,
    };

    const { data: inserted, error } = await supabase
      .from('submissions')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert failed:', error);
      throw new Error(`Failed to create submission: ${error.message}`);
    }

    return (inserted || record) as Submission;
  }

  async updateStatus(id: string, status: SubmissionStatus, note?: string): Promise<Submission> {
    if (!supabase) throw new Error('Supabase is not configured');

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
      console.error('Supabase update status failed:', error);
      throw new Error(`Failed to update submission status: ${error?.message}`);
    }

    return data as Submission;
  }

  async resetToSeed(): Promise<Submission[]> {
    if (!supabase) return [];
    // Delete all submissions to keep clean
    await supabase.from('submissions').delete().neq('id', '');
    return [];
  }

  async renameCategory(oldCat: string, newCat: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('submissions').update({ cat: newCat }).ilike('cat', oldCat);
  }
}

// Always export SupabaseSubmissionRepository as the active repository
export function getSubmissionRepository(): ISubmissionRepository {
  return new SupabaseSubmissionRepository();
}
