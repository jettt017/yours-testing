import { SubmissionFormData, ValidationErrors } from '../types';

export const DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/(drive\/(u\/\d\/)?folders\/|file\/d\/|open\?id=)[\w-]+/;
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
export const WA_REGEX = /^\+?[\d\s-]{8,16}$/;

export function validateStep(step: number, data: SubmissionFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 0) {
    if (!data.name.trim()) {
      errors.name = 'Enter your full name.';
    }
    if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Enter a valid email, like you@mail.com.';
    }
    if (!WA_REGEX.test(data.wa.trim())) {
      errors.wa = 'Enter a WhatsApp number with 8 or more digits.';
    }
  }

  if (step === 1) {
    if (!data.title.trim()) {
      errors.title = 'Give your artwork a title.';
    }
    if (data.desc.trim().length < 20) {
      errors.desc = 'Describe the concept in at least 20 characters.';
    }
  }

  if (step === 2) {
    if (!data.cat.trim()) {
      errors.cat = 'Pick one category.';
    }
  }

  if (step === 3) {
    if (!DRIVE_REGEX.test(data.link.trim())) {
      errors.link = 'Use a Google Drive file or folder link (drive.google.com/…).';
    }
  }

  return errors;
}

export function isStepValid(step: number, data: SubmissionFormData): boolean {
  const errs = validateStep(step, data);
  return Object.keys(errs).length === 0;
}
