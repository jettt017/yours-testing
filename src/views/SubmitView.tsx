import React, { useState, useEffect } from 'react';
import { SubmissionFormData, ValidationErrors, User } from '../types';
import { validateStep } from '../utils/validation';
import { ISubmissionRepository } from '../services/submissionRepository';
import { LogoLoader } from '../components/LogoLoader';
import { categoryService } from '../services/categoryService';

interface SubmitViewProps {
  repository: ISubmissionRepository;
  currentUser: User | null;
  onSuccess: (id: string, email: string) => void;
  onOpenAuth: (intent?: string) => void;
}

const STEPS = ['01 ABOUT', '02 ARTWORK', '03 CATEGORY', '04 SHARE', '05 REVIEW'];

export const SubmitView: React.FC<SubmitViewProps> = ({
  repository,
  currentUser,
  onSuccess,
  onOpenAuth,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    wa: '',
    inst: '',
    city: '',
    portfolio: '',
    title: '',
    year: new Date().getFullYear().toString(),
    medium: '',
    desc: '',
    cat: '',
    link: '',
  });

  const [categories, setCategories] = useState<string[]>(() => categoryService.getCategories());
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    return categoryService.subscribe((updated) => {
      setCategories(updated);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.name,
        email: prev.email || currentUser.email,
      }));
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <main className="main-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="glass-panel" style={{ padding: '48px 24px', maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="font-headline" style={{ fontSize: '32px', margin: '0 0 12px', color: 'var(--cb)' }}>
            Sign in to submit
          </h2>
          <p style={{ color: 'var(--bk)', fontSize: '15px', marginBottom: '28px' }}>
            Please sign in to your creator account so you can submit your artwork and track its curation review automatically.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenAuth('Sign in to submit your artwork.')}
          >
            [ SIGN IN / CREATE ACCOUNT ]
          </button>
        </div>
      </main>
    );
  }

  const handleInputChange = (field: keyof SubmissionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      handleNext();
      return;
    }

    // Final step submission
    setIsSubmitting(true);
    try {
      const created = await repository.create(formData);
      // Brief aesthetic pause to showcase the editorial logo loader animation
      await new Promise((resolve) => setTimeout(resolve, 1800));
      onSuccess(created.id, created.email);
    } catch (err) {
      console.error('Failed to submit artwork', err);
      alert('An error occurred while saving your submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="main-container">
      <h2 className="page-title">Submit your artwork</h2>
      <p className="page-subtitle">Fields marked * are required.</p>

      {/* Step Indicator (Desktop: 5 Columns) */}
      <div
        className="step-indicator-desktop"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={5}
      >
        {STEPS.map((label, index) => {
          const isCurrent = index === currentStep;
          const isDone = index < currentStep;

          return (
            <div
              key={label}
              style={{
                borderTop: `2px solid ${isCurrent || isDone ? 'var(--cb)' : 'var(--ln)'}`,
                paddingTop: '10px',
                fontSize: '12px',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent
                  ? 'var(--cb)'
                  : isDone
                  ? 'var(--bk)'
                  : 'var(--mt)',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Step Indicator (Mobile: Sleek Progress Bar & Title) */}
      <div className="step-indicator-mobile" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={5}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cb)' }}>
            STEP {currentStep + 1} OF 5
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bk)' }}>
            {STEPS[currentStep]}
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--ln)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((currentStep + 1) / 5) * 100}%`,
              height: '100%',
              borderRadius: '999px',
              background: 'var(--cb)',
              transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* Single Form with State Kept Across Steps */}
      <form onSubmit={handleSubmit} noValidate className="glass-panel submit-form-panel" style={{ padding: '32px 24px' }}>
        {/* Step 1: About */}
        {currentStep === 0 && (
          <div>
            <h3
              className="font-headline"
              style={{ fontSize: '24px', margin: '0 0 20px', color: 'var(--bk)' }}
            >
              About you
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px 20px',
              }}
            >
              <div>
                <label htmlFor="name" className="field-label">Full name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Rani Wulandari"
                  className={errors.name ? 'is-invalid' : ''}
                />
                <div className="field-error">{errors.name}</div>
              </div>

              <div>
                <label htmlFor="email" className="field-label">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@mail.com"
                  className={errors.email ? 'is-invalid' : ''}
                />
                <div className="field-error">{errors.email}</div>
              </div>

              <div>
                <label htmlFor="wa" className="field-label">WhatsApp *</label>
                <input
                  id="wa"
                  type="tel"
                  value={formData.wa}
                  onChange={(e) => handleInputChange('wa', e.target.value)}
                  placeholder="+6281234567890"
                  className={errors.wa ? 'is-invalid' : ''}
                />
                <div className="field-error">{errors.wa}</div>
              </div>

              <div>
                <label htmlFor="inst" className="field-label">Institution</label>
                <input
                  id="inst"
                  type="text"
                  value={formData.inst}
                  onChange={(e) => handleInputChange('inst', e.target.value)}
                  placeholder="University, Studio, or Independent"
                />
                <div className="field-error" />
              </div>

              <div>
                <label htmlFor="city" className="field-label">City</label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g. Yogyakarta"
                />
                <div className="field-error" />
              </div>

              <div>
                <label htmlFor="portfolio" className="field-label">Portfolio link</label>
                <input
                  id="portfolio"
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => handleInputChange('portfolio', e.target.value)}
                  placeholder="https://behance.net/..."
                />
                <div className="field-error" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Artwork */}
        {currentStep === 1 && (
          <div>
            <h3
              className="font-headline"
              style={{ fontSize: '24px', margin: '0 0 20px', color: 'var(--bk)' }}
            >
              Your artwork
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px 20px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label htmlFor="title" className="field-label">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Title of your piece"
                  className={errors.title ? 'is-invalid' : ''}
                />
                <div className="field-error">{errors.title}</div>
              </div>

              <div>
                <label htmlFor="year" className="field-label">Year</label>
                <input
                  id="year"
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="2026"
                />
                <div className="field-error" />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="medium" className="field-label">Medium</label>
              <input
                id="medium"
                type="text"
                value={formData.medium}
                onChange={(e) => handleInputChange('medium', e.target.value)}
                placeholder="Oil on canvas, 16mm film, generative audiovisual, etc."
              />
              <div className="field-error" />
            </div>

            <div>
              <label htmlFor="desc" className="field-label">Concept / description *</label>
              <textarea
                id="desc"
                rows={6}
                value={formData.desc}
                onChange={(e) => handleInputChange('desc', e.target.value)}
                placeholder="Describe your concept, context, process, and narrative (minimum 20 characters)..."
                className={errors.desc ? 'is-invalid' : ''}
              />
              <div className="field-error">{errors.desc}</div>
            </div>
          </div>
        )}

        {/* Step 3: Category */}
        {currentStep === 2 && (
          <div>
            <h3
              className="font-headline"
              style={{ fontSize: '24px', margin: '0 0 20px', color: 'var(--bk)' }}
            >
              Category
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--mt)', fontSize: '14px' }}>
              Select the primary category that best defines this artwork:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '12px',
              }}
            >
              {categories.map((c) => {
                const isSelected = formData.cat === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      handleInputChange('cat', c);
                    }}
                    aria-pressed={isSelected}
                    style={{
                      border: isSelected ? '1px solid transparent' : '1px solid var(--ln)',
                      background: isSelected
                        ? 'linear-gradient(145deg, var(--cb-light), var(--cb))'
                        : 'var(--card-bg)',
                      color: isSelected ? '#ffffff' : 'var(--bk)',
                      padding: '20px 16px',
                      borderRadius: '14px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: '15px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      boxShadow: isSelected
                        ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 10px 16px rgba(255, 255, 255, 0.3)'
                        : 'none',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="field-error" style={{ marginTop: '12px' }}>
              {errors.cat}
            </div>
          </div>
        )}

        {/* Step 4: Share */}
        {currentStep === 3 && (
          <div>
            <h3
              className="font-headline"
              style={{ fontSize: '24px', margin: '0 0 20px', color: 'var(--bk)' }}
            >
              Share your files
            </h3>
            <div>
              <label htmlFor="link" className="field-label">Google Drive URL *</label>
              <input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className={errors.link ? 'is-invalid' : ''}
              />
              <div className="field-error">{errors.link}</div>
            </div>

            <div
              style={{
                border: '1px dashed var(--cb)',
                padding: '16px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--tab-active-bg)',
                marginTop: '16px',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              <b style={{ color: 'var(--cb)', display: 'block', marginBottom: '4px' }}>
                Set sharing to "Anyone with the link can view."
              </b>
              Curators cannot open private files, and private links will be sent back for revision.
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <div>
            <h3
              className="font-headline"
              style={{ fontSize: '24px', margin: '0 0 20px', color: 'var(--bk)' }}
            >
              Review your submission
            </h3>

            <div className="table-container" style={{ margin: '16px 0' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'transparent',
                }}
              >
                <tbody>
                  {[
                    ['Name', formData.name],
                    ['Email', formData.email],
                    ['WhatsApp', formData.wa],
                    ['Institution', formData.inst],
                    ['City', formData.city],
                    ['Portfolio', formData.portfolio],
                    ['Title', formData.title],
                    ['Year', formData.year],
                    ['Medium', formData.medium],
                    ['Description', formData.desc],
                    ['Category', formData.cat],
                    ['Drive URL', formData.link],
                  ].map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--ln)' }}>
                      <td
                        style={{
                          padding: '12px 10px',
                          color: 'var(--mt)',
                          fontWeight: 700,
                          width: '32%',
                          verticalAlign: 'top',
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: '12px 10px',
                          color: 'var(--bk)',
                          wordBreak: 'break-word',
                          verticalAlign: 'top',
                        }}
                      >
                        {val ? String(val) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '32px',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{
              opacity: currentStep === 0 ? 0.35 : 1,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            [ ← BACK ]
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Submitting...'
              : currentStep === 4
              ? '[ SEND ARTWORK ↗ ]'
              : '[ NEXT → ]'}
          </button>
        </div>
      </form>

      {/* Editorial Logo Loader Overlay */}
      {isSubmitting && (
        <LogoLoader
          fullScreen
          label="Mendaftarkan karya seni Anda ke kurator..."
        />
      )}
    </main>
  );
};
