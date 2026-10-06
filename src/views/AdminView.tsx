import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Submission, SubmissionStatus, User, UserRole } from '../types';
import { ISubmissionRepository } from '../services/submissionRepository';
import { authService, StoredAccount } from '../services/authService';
import { categoryService } from '../services/categoryService';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { CustomDropdown } from '../components/CustomDropdown';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminViewProps {
  repository: ISubmissionRepository;
  currentUser: User | null;
  activeTab?: 'curate' | 'categories' | 'users';
  onTabChange?: (tab: 'curate' | 'categories' | 'users') => void;
  onOpenAuth: (intent?: string) => void;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  review: 'Under Review',
  approved: 'Approved',
  revision: 'Revision Required',
  rejected: 'Rejected',
};

const getStatusDotClass = (status: SubmissionStatus) => {
  switch (status) {
    case 'approved':
      return 'status-dot-approved';
    case 'review':
      return 'status-dot-review';
    case 'pending':
      return 'status-dot-pending';
    case 'revision':
      return 'status-dot-revision';
    case 'rejected':
      return 'status-dot-rejected';
    default:
      return 'status-dot-pending';
  }
};

const isImageUrl = (url?: string) => {
  if (!url) return false;
  return /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image/');
};

// Reusable Minimalist Asc/Desc Sort Indicator Icon
const SortIcon: React.FC<{ active: boolean; order: 'asc' | 'desc' }> = ({ active, order }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '6px',
        color: active ? 'var(--cb)' : 'var(--mt)',
        opacity: active ? 1 : 0.45,
        transition: 'all 0.15s ease',
        verticalAlign: 'middle',
      }}
    >
      {active ? (
        order === 'asc' ? (
          // Ascending: Arrow Up
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        ) : (
          // Descending: Arrow Down
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )
      ) : (
        // Neutral dual chevron
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="7 15 12 20 17 15" />
          <polyline points="7 9 12 4 17 9" />
        </svg>
      )}
    </span>
  );
};

export const AdminView: React.FC<AdminViewProps> = ({
  repository,
  currentUser,
  activeTab: controlledTab = 'curate',
  onTabChange: _onTabChange,
  onOpenAuth,
}) => {
  // Internal tab state synced with controlled tab
  const [internalTab, setInternalTab] = useState<'curate' | 'categories' | 'users'>(controlledTab);

  useEffect(() => {
    setInternalTab(controlledTab);
  }, [controlledTab]);

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Curation Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [curateSortField, setCurateSortField] = useState<'id' | 'title' | 'name' | 'cat' | 'date' | 'status'>('date');
  const [curateSortOrder, setCurateSortOrder] = useState<'asc' | 'desc'>('desc');

  // Categories State
  const [categories, setCategories] = useState<string[]>(() => categoryService.getCategories());
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categorySortField, setCategorySortField] = useState<'name' | 'count' | 'index'>('name');
  const [categorySortOrder, setCategorySortOrder] = useState<'asc' | 'desc'>('asc');

  // Users State
  const [users, setUsers] = useState<StoredAccount[]>(() => authService.getAllUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('creator');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortField, setUserSortField] = useState<'name' | 'role' | 'count' | 'index'>('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');

  // Custom Frosted Glass Confirmation / Alert Dialog State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert' | 'danger';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert' | 'danger';
    onConfirm: () => void;
  }) => {
    setDialogState({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel,
      cancelLabel: opts.cancelLabel,
      isDestructive: opts.isDestructive,
      type: opts.type || (opts.isDestructive ? 'danger' : 'confirm'),
      onConfirm: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        opts.onConfirm();
      },
      onCancel: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const showAlert = (title: string, message: string) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type: 'alert',
      confirmLabel: 'OK',
      onConfirm: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Load Submissions
  const loadSubmissions = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await repository.getAll();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, isAdmin]);

  useEffect(() => {
    loadSubmissions();
    refreshUsers();
  }, [loadSubmissions]);

  // Subscribe to category changes
  useEffect(() => {
    return categoryService.subscribe((updated) => {
      setCategories(updated);
    });
  }, []);

  // Curate Sorting Handler
  const handleCurateSort = (field: 'id' | 'title' | 'name' | 'cat' | 'date' | 'status') => {
    if (curateSortField === field) {
      setCurateSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCurateSortField(field);
      setCurateSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  // Filtered & Sorted Submissions Logic
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Status filter
        if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && sub.cat.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // Search query across Title, Artist, Email, ID, Category
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = sub.title.toLowerCase().includes(q);
          const matchName = sub.name.toLowerCase().includes(q);
          const matchEmail = sub.email.toLowerCase().includes(q);
          const matchId = sub.id.toLowerCase().includes(q);
          const matchCat = sub.cat.toLowerCase().includes(q);
          if (!matchTitle && !matchName && !matchEmail && !matchId && !matchCat) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (curateSortField === 'date') {
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (curateSortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (curateSortField === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (curateSortField === 'cat') {
          cmp = a.cat.localeCompare(b.cat);
        } else if (curateSortField === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else if (curateSortField === 'id') {
          cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
        }
        return curateSortOrder === 'asc' ? cmp : -cmp;
      });
  }, [submissions, statusFilter, categoryFilter, searchQuery, curateSortField, curateSortOrder]);

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCurateSortField('date');
    setCurateSortOrder('desc');
  };

  // Category Sorting Handler
  const handleCategorySort = (field: 'name' | 'count' | 'index') => {
    if (categorySortField === field) {
      setCategorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCategorySortField(field);
      setCategorySortOrder('asc');
    }
  };

  // Filtered & Sorted Categories Logic
  const filteredCategories = useMemo(() => {
    let list = categories.map((cat, idx) => {
      const count = submissions.filter((s) => s.cat.toLowerCase() === cat.toLowerCase()).length;
      return { name: cat, count, originalIndex: idx };
    });

    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (categorySortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (categorySortField === 'count') {
        cmp = a.count - b.count;
      } else if (categorySortField === 'index') {
        cmp = a.originalIndex - b.originalIndex;
      }
      return categorySortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [categories, submissions, categorySearchQuery, categorySortField, categorySortOrder]);

  // User Sorting Handler
  const handleUserSort = (field: 'name' | 'role' | 'count' | 'index') => {
    if (userSortField === field) {
      setUserSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
  };

  // Filtered & Sorted Users Logic
  const filteredUsers = useMemo(() => {
    // Only superadmin can see superadmin accounts; regular admins cannot see them
    const visibleUsers = isSuperAdmin
      ? users
      : users.filter((u) => u.role !== 'superadmin');

    let list = visibleUsers.map((u, idx) => {
      const count = submissions.filter(
        (s) => s.email.trim().toLowerCase() === u.email.trim().toLowerCase()
      ).length;
      return { user: u, count, originalIndex: idx };
    });

    if (userSearchQuery.trim()) {
      const q = userSearchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.user.name.toLowerCase().includes(q) ||
          item.user.email.toLowerCase().includes(q) ||
          item.user.role.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (userSortField === 'name') {
        cmp = a.user.name.localeCompare(b.user.name);
      } else if (userSortField === 'role') {
        cmp = a.user.role.localeCompare(b.user.role);
      } else if (userSortField === 'count') {
        cmp = a.count - b.count;
      } else if (userSortField === 'index') {
        cmp = a.originalIndex - b.originalIndex;
      }
      return userSortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [users, submissions, userSearchQuery, userSortField, userSortOrder, isSuperAdmin]);

  // Category Actions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    const res = categoryService.addCategory(newCatName);
    if (!res.success) {
      setCatError(res.error || 'Failed to add category.');
      return;
    }
    setCategories(res.categories);
    const added = newCatName.trim();
    setNewCatName('');
    setCatSuccess(`Category "${added}" successfully added.`);
    setTimeout(() => setCatSuccess(''), 3500);
  };

  const handleStartEditCategory = (catName: string) => {
    setEditingCategory(catName);
    setEditCatName(catName);
    setCatError('');
    setCatSuccess('');
  };

  const handleSaveEditCategory = async (oldName: string) => {
    setCatError('');
    setCatSuccess('');
    const trimmed = editCatName.trim();
    if (!trimmed) {
      setCatError('Category name cannot be empty.');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }

    const res = categoryService.renameCategory(oldName, trimmed);
    if (!res.success) {
      setCatError(res.error || 'Failed to rename category.');
      return;
    }

    try {
      await repository.renameCategory(oldName, trimmed);
      setSubmissions((prev) =>
        prev.map((s) => (s.cat.toLowerCase() === oldName.toLowerCase() ? { ...s, cat: trimmed } : s))
      );
    } catch (err) {
      console.warn('Repository category rename warning:', err);
    }

    if (categoryFilter.toLowerCase() === oldName.toLowerCase()) {
      setCategoryFilter(trimmed);
    }

    setCategories(res.categories);
    setEditingCategory(null);
    setCatSuccess(`Category renamed to "${trimmed}".`);
    setTimeout(() => setCatSuccess(''), 3500);
  };

  const handleDeleteCategory = (catName: string) => {
    const count = submissions.filter((s) => s.cat.toLowerCase() === catName.toLowerCase()).length;
    const warning =
      count > 0
        ? `There are currently ${count} artworks categorized under "${catName}". Are you sure you want to permanently delete this category?`
        : `Are you sure you want to delete category "${catName}"?`;

    showConfirm({
      title: 'Delete Category',
      message: warning,
      confirmLabel: 'Delete Category',
      isDestructive: true,
      onConfirm: () => {
        const res = categoryService.deleteCategory(catName);
        if (!res.success) {
          showAlert('Cannot Delete Category', res.error || 'Failed to delete category.');
          return;
        }
        setCategories(res.categories);
        if (categoryFilter.toLowerCase() === catName.toLowerCase()) {
          setCategoryFilter('all');
        }
      },
    });
  };

  const handleResetCategories = () => {
    showConfirm({
      title: 'Reset Categories',
      message: 'Are you sure you want to reset the categories list back to the default 8 categories?',
      confirmLabel: 'Reset Categories',
      isDestructive: false,
      onConfirm: () => {
        const reset = categoryService.resetToDefault();
        setCategories(reset);
      },
    });
  };

  // User Actions
  const refreshUsers = async () => {
    const list = await authService.fetchProfiles();
    setUsers([...list]);
  };

  const handleDeleteUser = (u: StoredAccount) => {
    if (u.id === currentUser?.id) {
      showAlert('Action Not Allowed', 'You cannot delete your own active administrator account.');
      return;
    }

    showConfirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${u.name}" (${u.email})? This action cannot be undone.`,
      confirmLabel: 'Delete User',
      isDestructive: true,
      onConfirm: async () => {
        const success = await authService.deleteUser(u.id);
        if (success) {
          await refreshUsers();
          setUserSuccess(`User "${u.name}" has been deleted.`);
          setTimeout(() => setUserSuccess(''), 3500);
        } else {
          showAlert('Failed', 'Failed to delete user account.');
        }
      },
    });
  };

  const handleToggleRole = (u: StoredAccount) => {
    if (!isSuperAdmin) {
      showAlert('Access Denied', 'Only Superadmin can change user roles.');
      return;
    }
    if (u.id === currentUser?.id) {
      showAlert('Action Not Allowed', 'You cannot change your own Superadmin role.');
      return;
    }

    const newRole: UserRole = u.role === 'admin' ? 'creator' : 'admin';
    const actionName = newRole === 'admin' ? 'Promote to Admin' : 'Demote to Creator';

    showConfirm({
      title: actionName,
      message: `Are you sure you want to ${newRole === 'admin' ? 'promote' : 'demote'} user "${u.name}" (${u.email}) to ${newRole}?`,
      confirmLabel: actionName,
      isDestructive: newRole === 'creator',
      onConfirm: async () => {
        const success = await authService.updateUserRole(u.id, newRole);
        if (success) {
          await refreshUsers();
          setUserSuccess(`User "${u.name}" is now an ${newRole}.`);
          setTimeout(() => setUserSuccess(''), 3500);
        } else {
          showAlert('Failed', 'Failed to update user role.');
        }
      },
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    try {
      if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) {
        setUserError('All fields are required.');
        return;
      }
      if (newUserPass.trim().length < 8) {
        setUserError('Password must be at least 8 characters.');
        return;
      }
      await authService.createUser(newUserName, newUserEmail, newUserPass, newUserRole);
      await refreshUsers();
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      setIsAddUserOpen(false);
      setUserSuccess('New user account created successfully.');
      setTimeout(() => setUserSuccess(''), 3500);
    } catch (err) {
      if (err instanceof Error) {
        setUserError(err.message);
      } else {
        setUserError('Failed to create user account.');
      }
    }
  };

  // Curation Decisions
  const countStatus = (status: SubmissionStatus) =>
    submissions.filter((s) => s.status === status).length;

  const handleRowClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDrawerOpen(true);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, submission: Submission) => {
    if (e.key === 'Enter') {
      handleRowClick(submission);
    }
  };

  const handleStatusUpdate = async (status: SubmissionStatus, note?: string) => {
    if (!selectedSubmission) return;

    try {
      const updated = await repository.updateStatus(selectedSubmission.id, status, note);
      setSelectedSubmission(null);
      setIsDrawerOpen(false);
      setIsModalOpen(false);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } catch (err) {
      console.error('Failed to update status', err);
      showAlert('Update Failed', 'Failed to update artwork curation status. Please try again.');
    }
  };

  const handleResetData = () => {
    showConfirm({
      title: 'Reset Sample Data',
      message: 'Are you sure you want to reset all submission data back to the default seed submissions? Any new entries will be cleared.',
      confirmLabel: 'Reset All Data',
      isDestructive: true,
      onConfirm: async () => {
        const seed = await repository.resetToSeed();
        setSubmissions(seed);
        setSelectedSubmission(null);
        setIsDrawerOpen(false);
        setIsModalOpen(false);
      },
    });
  };

  if (!isAdmin) {
    return (
      <main className="admin-main-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="admin-card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="font-headline" style={{ fontSize: '28px', margin: '0 0 12px', color: 'var(--rd)' }}>
            Curator Access Only
          </h2>
          <p style={{ color: 'var(--mt)', fontSize: '15px', marginBottom: '28px' }}>
            The Curation Console is restricted to editorial team curators. Please sign in with an administrator account to review creator submissions.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenAuth('Sign in with your curator account.')}
          >
            Sign In As Curator
          </button>
        </div>
      </main>
    );
  }

  // Helper mapping dropdown sortBy value
  const currentSortDropdownValue =
    curateSortField === 'date' && curateSortOrder === 'desc'
      ? 'newest'
      : curateSortField === 'date' && curateSortOrder === 'asc'
      ? 'oldest'
      : curateSortField === 'title' && curateSortOrder === 'asc'
      ? 'title-asc'
      : curateSortField === 'title' && curateSortOrder === 'desc'
      ? 'title-desc'
      : curateSortField === 'name' && curateSortOrder === 'asc'
      ? 'artist-asc'
      : 'custom';

  return (
    <main className="admin-main-container">
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: 'var(--bk)' }}>
            {internalTab === 'curate' && 'Curate Overview'}
            {internalTab === 'categories' && 'Category Overview'}
            {internalTab === 'users' && 'User Overview'}
          </h2>
          <p style={{ color: 'var(--mt)', fontSize: '14px', margin: 0 }}>
            Editorial Console &mdash; Logged in as <strong style={{ color: 'var(--bk)' }}>{currentUser.name}</strong> ({currentUser.email})
          </p>
        </div>

        {internalTab === 'curate' && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetData}
            style={{ fontSize: '12px', padding: '8px 18px', borderRadius: '999px' }}
          >
            Reset Sample Data
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: CURATE (ARTWORK CURATION WITH SORTABLE TABLE) */}
      {/* ============================================================== */}
      {internalTab === 'curate' && (
        <div>
          {/* Minimalist Metric Stat Pills */}
          <div className="admin-metrics-grid">
            {[
              { label: 'Total Submissions', count: submissions.length, filterVal: 'all', color: 'var(--cb)' },
              { label: 'Pending Review', count: countStatus('pending'), filterVal: 'pending', color: '#f59e0b' },
              { label: 'Under Review', count: countStatus('review'), filterVal: 'review', color: '#3b82f6' },
              { label: 'Approved Artworks', count: countStatus('approved'), filterVal: 'approved', color: '#10b981' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="admin-card"
                onClick={() => setStatusFilter(metric.filterVal)}
                style={{
                  padding: '16px 20px',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: statusFilter === metric.filterVal ? '2px solid var(--cb)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === metric.filterVal ? '0 4px 16px rgba(0, 0, 114, 0.08)' : undefined,
                }}
              >
                <div>
                  <div style={{ color: 'var(--mt)', fontSize: '12px', fontWeight: 500 }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--bk)', marginTop: '2px', lineHeight: 1.1 }}>
                    {metric.count}
                  </div>
                </div>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: metric.color,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Minimalist White Table Card */}
          <div className="admin-card">
            {/* Card Header with Title and Segmented Status Filter */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--bk)', letterSpacing: '-0.01em' }}>
                  Submission List
                </h3>
                <span className="minimal-pill">
                  {filteredSubmissions.length} of {submissions.length}
                </span>
              </div>

              {/* Segmented Status Tabs */}
              <div className="minimal-segmented-group">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Review', value: 'review' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Revision', value: 'revision' },
                  { label: 'Rejected', value: 'rejected' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`minimal-segmented-btn ${statusFilter === tab.value ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-bar: Search & Custom Dropdown Filters */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 0',
              }}
            >
              {/* Rounded-full Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <input
                  type="text"
                  placeholder="Search title, artist, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    borderRadius: '999px',
                    paddingLeft: '38px',
                    paddingRight: searchQuery ? '32px' : '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--ln)',
                  }}
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mt)',
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--mt)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Right Select Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Minimalist Category Filter Dropdown */}
                <CustomDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  labelPrefix="Category"
                  menuWidth="220px"
                  icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                  }
                  options={[
                    { value: 'all', label: 'All Categories', count: submissions.length },
                    ...categories.map((cat) => ({
                      value: cat,
                      label: cat,
                      count: submissions.filter((s) => s.cat.toLowerCase() === cat.toLowerCase()).length,
                    })),
                  ]}
                />

                {/* Minimalist Sort Dropdown */}
                <CustomDropdown
                  value={currentSortDropdownValue}
                  onChange={(val) => {
                    if (val === 'newest') {
                      setCurateSortField('date');
                      setCurateSortOrder('desc');
                    } else if (val === 'oldest') {
                      setCurateSortField('date');
                      setCurateSortOrder('asc');
                    } else if (val === 'title-asc') {
                      setCurateSortField('title');
                      setCurateSortOrder('asc');
                    } else if (val === 'title-desc') {
                      setCurateSortField('title');
                      setCurateSortOrder('desc');
                    } else if (val === 'artist-asc') {
                      setCurateSortField('name');
                      setCurateSortOrder('asc');
                    }
                  }}
                  labelPrefix="Sort"
                  menuWidth="190px"
                  icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
                    </svg>
                  }
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'title-asc', label: 'Title (A → Z)' },
                    { value: 'title-desc', label: 'Title (Z → A)' },
                    { value: 'artist-asc', label: 'Artist Name (A → Z)' },
                  ]}
                />

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="minimal-pill"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.1)',
                      color: 'var(--cb)',
                      fontWeight: 600,
                      height: '36px',
                      padding: '0 14px',
                    }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Sortable Table with Horizontal Scroll */}
            <div className="table-container">
              <table className="minimal-table">
                <thead>
                  <tr>
                    {/* Column: ID */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('id')}
                      style={{ width: '60px' }}
                      title="Sort by ID"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>#</span>
                        <SortIcon active={curateSortField === 'id'} order={curateSortOrder} />
                      </div>
                    </th>

                    {/* Column: Artwork */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('title')}
                      title="Sort by Artwork Title"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Artwork</span>
                        <SortIcon active={curateSortField === 'title'} order={curateSortOrder} />
                      </div>
                    </th>

                    {/* Column: Artist */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('name')}
                      title="Sort by Artist Name"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Artist</span>
                        <SortIcon active={curateSortField === 'name'} order={curateSortOrder} />
                      </div>
                    </th>

                    {/* Column: Category */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('cat')}
                      title="Sort by Category"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Category</span>
                        <SortIcon active={curateSortField === 'cat'} order={curateSortOrder} />
                      </div>
                    </th>

                    {/* Column: Date */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('date')}
                      title="Sort by Date"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Date</span>
                        <SortIcon active={curateSortField === 'date'} order={curateSortOrder} />
                      </div>
                    </th>

                    {/* Column: Status */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCurateSort('status')}
                      title="Sort by Status"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Status</span>
                        <SortIcon active={curateSortField === 'status'} order={curateSortOrder} />
                      </div>
                    </th>

                    <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--mt)' }}>
                        Loading submissions...
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--mt)' }}>
                        <div style={{ fontSize: '15px', color: 'var(--bk)', marginBottom: '8px' }}>
                          No artworks match the current filters.
                        </div>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleResetFilters}
                            style={{ fontSize: '12px', marginTop: '6px', borderRadius: '999px' }}
                          >
                            Clear All Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, idx) => {
                      const rowNum = String(idx + 1).padStart(2, '0');
                      const hasImage = isImageUrl(sub.link);

                      return (
                        <tr
                          key={sub.id}
                          tabIndex={0}
                          onClick={() => handleRowClick(sub)}
                          onKeyDown={(e) => handleRowKeyDown(e, sub)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Row Number */}
                          <td style={{ color: 'var(--mt)', fontWeight: 500, fontSize: '12.5px' }}>
                            {rowNum}
                          </td>

                          {/* Artwork (Avatar Circle + 2-line title/medium) */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="minimal-avatar">
                                {hasImage ? (
                                  <img
                                    src={sub.link}
                                    alt={sub.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <span>{sub.title.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: 'var(--bk)',
                                    fontSize: '13.5px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '220px',
                                  }}
                                >
                                  {sub.title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--mt)' }}>
                                  {sub.medium || sub.cat}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Artist (Name + Email) */}
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--bk)', fontSize: '13px' }}>
                                {sub.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--mt)' }}>
                                {sub.email}
                              </div>
                            </div>
                          </td>

                          {/* Category Pill */}
                          <td>
                            <span className="minimal-pill">
                              {sub.cat}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ color: 'var(--mt)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                            {sub.date}
                          </td>

                          {/* Status with Colored Dot */}
                          <td>
                            <div className="minimal-status">
                              <span className={`status-dot ${getStatusDotClass(sub.status)}`} />
                              <span style={{ color: 'var(--bk)' }}>{STATUS_LABELS[sub.status]}</span>
                            </div>
                          </td>

                          {/* Minimalist 3-Dot Action Button */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="minimal-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(sub);
                              }}
                              title="Review Submission"
                              aria-label="Review Submission"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: CATEGORY (WITH SEARCH, SORTABLE TABLE, & STATIC COUNT) */}
      {/* ============================================================== */}
      {internalTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add Category Minimalist Card */}
          <div className="admin-card" style={{ padding: '24px 28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--bk)' }}>
              Add New Category
            </h3>
            <p style={{ color: 'var(--mt)', fontSize: '13px', margin: '0 0 16px' }}>
              Categories created here are immediately available on creator submission forms.
            </p>

            <form
              onSubmit={handleAddCategory}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                maxWidth: '640px',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="e.g. 3D Animation, Fashion Design, Sound Art..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ borderRadius: '999px', padding: '9px 16px', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '9px 22px', fontSize: '13px' }}
              >
                + Add Category
              </button>
            </form>

            {catError && (
              <div style={{ color: 'var(--rd)', fontSize: '13px', marginTop: '10px' }}>
                {catError}
              </div>
            )}
            {catSuccess && (
              <div style={{ color: '#10b981', fontSize: '13px', marginTop: '10px', fontWeight: 600 }}>
                {catSuccess}
              </div>
            )}
          </div>

          {/* Minimalist Categories Table Card */}
          <div className="admin-card">
            {/* Top Bar with Title & Reset Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--bk)' }}>
                  Category Directory
                </h3>
                <span className="minimal-pill">
                  {categories.length} total
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetCategories}
                style={{ fontSize: '12px', padding: '6px 16px', borderRadius: '999px' }}
              >
                Reset to Default 8
              </button>
            </div>

            {/* Category Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 0',
              }}
            >
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <input
                  type="text"
                  placeholder="Search category name..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  style={{
                    borderRadius: '999px',
                    paddingLeft: '38px',
                    paddingRight: categorySearchQuery ? '32px' : '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--ln)',
                  }}
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mt)',
                    pointerEvents: 'none',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--mt)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {categorySearchQuery && (
                <span style={{ fontSize: '12.5px', color: 'var(--mt)' }}>
                  Found <strong>{filteredCategories.length}</strong> matching categories
                </span>
              )}
            </div>

            {/* Sortable Category Table */}
            <div className="table-container">
              <table className="minimal-table">
                <thead>
                  <tr>
                    {/* Sortable # */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCategorySort('index')}
                      style={{ width: '60px' }}
                      title="Sort by Index"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>#</span>
                        <SortIcon active={categorySortField === 'index'} order={categorySortOrder} />
                      </div>
                    </th>

                    {/* Sortable Category Name */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCategorySort('name')}
                      title="Sort by Category Name"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Category Name</span>
                        <SortIcon active={categorySortField === 'name'} order={categorySortOrder} />
                      </div>
                    </th>

                    {/* Sortable Artworks Count */}
                    <th
                      className="sortable-th"
                      onClick={() => handleCategorySort('count')}
                      title="Sort by Artwork Count"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Registered Artworks</span>
                        <SortIcon active={categorySortField === 'count'} order={categorySortOrder} />
                      </div>
                    </th>

                    <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--mt)' }}>
                        No categories found matching "{categorySearchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(({ name: cat, count }, idx) => {
                      const isEditing = editingCategory === cat;
                      const rowNum = String(idx + 1).padStart(2, '0');

                      return (
                        <tr key={cat}>
                          {/* ID Number */}
                          <td style={{ color: 'var(--mt)', fontWeight: 500, fontSize: '12.5px' }}>
                            {rowNum}
                          </td>

                          {/* Category Name (with Tag Avatar) */}
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '320px' }}>
                                <input
                                  type="text"
                                  value={editCatName}
                                  onChange={(e) => setEditCatName(e.target.value)}
                                  style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '999px' }}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditCategory(cat);
                                    if (e.key === 'Escape') setEditingCategory(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleSaveEditCategory(cat)}
                                  style={{ padding: '6px 14px', fontSize: '12px' }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => setEditingCategory(null)}
                                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '999px' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="minimal-avatar">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                  </svg>
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--bk)', fontSize: '14px' }}>
                                  {cat}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Registered Count: Static badge */}
                          <td>
                            <span className="minimal-pill">
                              {count} {count === 1 ? 'artwork' : 'artworks'}
                            </span>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td style={{ textAlign: 'right' }}>
                            {!isEditing && (
                              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  style={{
                                    background: 'none',
                                    border: '1px solid var(--ln)',
                                    borderRadius: '999px',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    color: 'var(--bk)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  disabled={categories.length <= 1}
                                  title={categories.length <= 1 ? 'At least 1 category required' : `Delete ${cat}`}
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(229, 48, 58, 0.25)',
                                    borderRadius: '999px',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    color: 'var(--rd)',
                                    cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: USER (WITH SEARCH, SORTABLE TABLE, & ROLE ICONS) */}
      {/* ============================================================== */}
      {internalTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action Card */}
          <div
            className="admin-card"
            style={{
              padding: '20px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px', color: 'var(--bk)' }}>
                User Accounts
              </h3>
              <p style={{ color: 'var(--mt)', fontSize: '13px', margin: 0 }}>
                Manage registered creator contributors and editorial curators.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              style={{ fontSize: '13px', padding: '9px 20px' }}
            >
              {isAddUserOpen ? '✕ Close Form' : '+ Create User'}
            </button>
          </div>

          {userSuccess && (
            <div
              className="admin-card"
              style={{
                padding: '12px 20px',
                color: '#10b981',
                fontWeight: 600,
                fontSize: '13px',
                borderColor: '#10b981',
              }}
            >
              {userSuccess}
            </div>
          )}

          {/* Add User Expandable Card */}
          {isAddUserOpen && (
            <div className="admin-card" style={{ padding: '24px 28px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--bk)' }}>
                Register New User
              </h4>

              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label className="field-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      style={{ borderRadius: '999px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label">Email *</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      style={{ borderRadius: '999px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label">Password *</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      style={{ borderRadius: '999px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label">User Role *</label>
                    <CustomDropdown
                      value={newUserRole}
                      onChange={(val) => setNewUserRole(val as UserRole)}
                      menuWidth="240px"
                      icon={
                        newUserRole === 'admin' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        )
                      }
                      options={
                        isSuperAdmin
                          ? [
                              {
                                value: 'creator',
                                label: 'Creator (Contributor)',
                                icon: (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                ),
                              },
                              {
                                value: 'admin',
                                label: 'Admin (Editorial Curator)',
                                icon: (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                ),
                              },
                            ]
                          : [
                              {
                                value: 'creator',
                                label: 'Creator (Contributor)',
                                icon: (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                ),
                              },
                            ]
                      }
                    />
                  </div>
                </div>

                {userError && (
                  <div style={{ color: 'var(--rd)', fontSize: '13px', marginBottom: '14px' }}>
                    {userError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>
                    Save User
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddUserOpen(false)}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '999px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Minimalist Users Table Card */}
          <div className="admin-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--bk)' }}>
                  User Directory
                </h3>
                <span className="minimal-pill">
                  {users.length} registered
                </span>
              </div>
            </div>

            {/* User Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 0',
              }}
            >
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <input
                  type="text"
                  placeholder="Search name, email, or role..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{
                    borderRadius: '999px',
                    paddingLeft: '38px',
                    paddingRight: userSearchQuery ? '32px' : '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--ln)',
                  }}
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mt)',
                    pointerEvents: 'none',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--mt)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {userSearchQuery && (
                <span style={{ fontSize: '12.5px', color: 'var(--mt)' }}>
                  Found <strong>{filteredUsers.length}</strong> matching users
                </span>
              )}
            </div>

            {/* Sortable Users Table */}
            <div className="table-container">
              <table className="minimal-table">
                <thead>
                  <tr>
                    {/* Sortable # */}
                    <th
                      className="sortable-th"
                      onClick={() => handleUserSort('index')}
                      style={{ width: '60px' }}
                      title="Sort by Index"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>#</span>
                        <SortIcon active={userSortField === 'index'} order={userSortOrder} />
                      </div>
                    </th>

                    {/* Sortable User Name */}
                    <th
                      className="sortable-th"
                      onClick={() => handleUserSort('name')}
                      title="Sort by User Name"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>User</span>
                        <SortIcon active={userSortField === 'name'} order={userSortOrder} />
                      </div>
                    </th>

                    {/* Sortable Role */}
                    <th
                      className="sortable-th"
                      onClick={() => handleUserSort('role')}
                      title="Sort by Role"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Role</span>
                        <SortIcon active={userSortField === 'role'} order={userSortOrder} />
                      </div>
                    </th>

                    {/* Sortable Artworks Count */}
                    <th
                      className="sortable-th"
                      onClick={() => handleUserSort('count')}
                      title="Sort by Artworks Count"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span>Artworks</span>
                        <SortIcon active={userSortField === 'count'} order={userSortOrder} />
                      </div>
                    </th>

                    <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--mt)' }}>
                        No users found matching "{userSearchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(({ user: u, count }, idx) => {
                      const isSelf = u.id === currentUser?.id;
                      const rowNum = String(idx + 1).padStart(2, '0');

                      return (
                        <tr key={u.id}>
                          {/* ID */}
                          <td style={{ color: 'var(--mt)', fontWeight: 500, fontSize: '12.5px' }}>
                            {rowNum}
                          </td>

                          {/* User Avatar + Name + Email */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="minimal-avatar">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--bk)', fontSize: '13.5px' }}>
                                  {u.name} {isSelf && <span style={{ color: 'var(--cb)', fontSize: '11px', marginLeft: '4px' }}>(You)</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--mt)' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role (Clean SVG Badge - No Emojis) */}
                          <td>
                            <span
                              className="minimal-pill"
                              style={{
                                background:
                                  u.role === 'superadmin'
                                    ? 'linear-gradient(135deg, rgba(11, 32, 230, 0.15), rgba(111, 155, 255, 0.2))'
                                    : u.role === 'admin'
                                    ? 'rgba(0, 0, 114, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                color: u.role === 'superadmin' || u.role === 'admin' ? 'var(--cb)' : 'var(--bk)',
                                fontWeight: 600,
                                border: u.role === 'superadmin' ? '1px solid var(--cb-light)' : 'none',
                              }}
                            >
                              {u.role === 'superadmin' ? (
                                <>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    stroke="none"
                                    aria-hidden="true"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                  <span>Super Admin</span>
                                </>
                              ) : u.role === 'admin' ? (
                                <>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                  <span>Admin</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  <span>Creator</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Submissions count */}
                          <td>
                            <span className="minimal-pill">
                              {count} {count === 1 ? 'artwork' : 'artworks'}
                            </span>
                          </td>

                          {/* Action: Promote/Demote (Only for Superadmin) + Delete */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {isSuperAdmin && u.role !== 'superadmin' && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleRole(u)}
                                  title={u.role === 'admin' ? 'Demote to Creator' : 'Promote to Admin'}
                                  style={{
                                    background: u.role === 'admin' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 114, 0.08)',
                                    border: `1px solid ${u.role === 'admin' ? 'var(--ln)' : 'var(--cb-light)'}`,
                                    borderRadius: '999px',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    color: u.role === 'admin' ? 'var(--bk)' : 'var(--cb)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  {u.role === 'admin' ? 'Demote' : 'Promote to Admin'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf}
                                title={isSelf ? 'Cannot delete your active account' : `Delete user ${u.name}`}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(229, 48, 58, 0.25)',
                                  borderRadius: '999px',
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  color: 'var(--rd)',
                                  cursor: isSelf ? 'not-allowed' : 'pointer',
                                  opacity: isSelf ? 0.35 : 1,
                                  fontWeight: 600,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Right-side Detail Drawer for Curation Decision */}
      <Drawer
        submission={selectedSubmission}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAction={(status) => handleStatusUpdate(status)}
        onRequestRevision={() => setIsModalOpen(true)}
      />

      {/* Feedback Modal for Revision Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(feedback) => handleStatusUpdate('revision', feedback)}
      />

      {/* Custom Frosted Glass Alert / Confirm Modal */}
      <ConfirmModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        isDestructive={dialogState.isDestructive}
        type={dialogState.type}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </main>
  );
};

export default AdminView;
