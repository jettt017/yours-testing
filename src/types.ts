export type SubmissionStatus = 'pending' | 'review' | 'approved' | 'revision' | 'rejected';

export type Category =
  | 'Seni Rupa'
  | 'Terapan'
  | 'Kriya'
  | 'Fotografi'
  | 'Tari'
  | 'Musik'
  | 'Teater'
  | 'Digital Art';

export interface Submission {
  id: string;
  name: string;
  email: string;
  wa: string;
  inst: string;
  city: string;
  portfolio: string;
  title: string;
  year: string;
  medium: string;
  desc: string;
  cat: Category | string;
  link: string;
  status: SubmissionStatus;
  note: string;
  date: string;
}

export type ViewType = 'home' | 'submit' | 'success' | 'track' | 'admin';

export type UserRole = 'creator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SubmissionFormData {
  name: string;
  email: string;
  wa: string;
  inst: string;
  city: string;
  portfolio: string;
  title: string;
  year: string;
  medium: string;
  desc: string;
  cat: string;
  link: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  wa?: string;
  title?: string;
  desc?: string;
  cat?: string;
  link?: string;
  [key: string]: string | undefined;
}
