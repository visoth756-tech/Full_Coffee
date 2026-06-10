import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  FolderTree, Plus, Edit2, Trash2, Loader2, CheckCircle,
  AlertTriangle, X, Search, ChevronLeft, ChevronRight, Package
} from 'lucide-react';
import api from '../api/axios';

export default function Categories() {
  const { token } = useSelector((state) => state.auth);

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form & target data
  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Feedback
  const [noticeMessage, setNoticeMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.list) {
        setCategories(response.data.list);
        setTotalCategories(response.data.total_categories || response.data.list.length);
        setLastUpdated(new Date());
      } else if (Array.isArray(response.data)) {
        setCategories(response.data);
        setTotalCategories(response.data.length);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setErrorMessage('Failed to load category list. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search
  useEffect(() => {
    let result = [...categories];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(cat =>
        cat.category_name.toLowerCase().includes(q)
      );
    }
    setFilteredCategories(result);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setNoticeMessage('');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('token')}`
      }
    };

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, {
          category_name: categoryName.trim().toLowerCase()
        }, config);
        setNoticeMessage('Category updated successfully.');
        setIsEditModalOpen(false);
      } else {
        await api.post('/categories', {
          category_name: categoryName.trim().toLowerCase()
        }, config);
        setNoticeMessage('New category created.');
        setIsAddModalOpen(false);
      }
      setCategoryName('');
      setEditingId(null);
      fetchCategories();
      setTimeout(() => setNoticeMessage(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      setErrorMessage(msg || 'Operation failed. Check admin permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/categories/${deletingItem.category_id}`, {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
      });
      setNoticeMessage(`Category "${deletingItem.category_name}" removed.`);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchCategories();
      setTimeout(() => setNoticeMessage(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      setErrorMessage(msg || 'Cannot delete category that contains products.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (category) => {
    setEditingId(category.category_id);
    setCategoryName(category.category_name);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category) => {
    setDeletingItem(category);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setCategoryName('');
    setEditingId(null);
    setDeletingItem(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Product Categories
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage menu sections · {totalCategories} total {totalCategories === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all"
        />
      </div>

      {/* Notifications */}
      {noticeMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle size={18} /> {noticeMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderTree size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {searchQuery ? 'No matching categories found.' : 'No categories yet. Create your first category!'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Category Name</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {paginatedCategories.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                        #{cat.category_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <FolderTree size={16} />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                            {cat.category_name}
                          </span>
                          {cat.product_count > 0 && (
                            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                              {cat.product_count} items
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                            title="Edit category"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(cat)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                            title="Delete category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginatedCategories.map((cat) => (
                <div key={cat.category_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                      <FolderTree size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {cat.category_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {cat.category_id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(cat)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lastUpdated && (
        <div className="text-right text-[10px] text-slate-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Modal onClose={closeModals} title={isEditModalOpen ? 'Edit Category' : 'New Category'} icon={<FolderTree size={18} />}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Category name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g., Hot Coffees, Pastries, Teas"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all capitalize"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button type="submit" loading={isSubmitting} icon={isEditModalOpen ? <Edit2 size={14} /> : <Plus size={14} />}>
                {isEditModalOpen ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingItem && (
        <Modal onClose={closeModals} title="Delete category" icon={<AlertTriangle size={18} />} danger>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete <strong className="text-rose-600">{deletingItem.category_name}</strong>?
            </p>
            {deletingItem.product_count > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs">
                <Package size={14} />
                <span>This category contains {deletingItem.product_count} product(s). Deleting it may require reassigning them first.</span>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={isSubmitting} icon={<Trash2 size={14} />}>
                Delete permanently
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable Modal Component
const Modal = ({ children, onClose, title, icon, danger = false }) => (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scaleIn">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${danger ? 'text-rose-500' : 'text-amber-500'}`}>
            {icon}
          </div>
          <h3 className="font-black text-sm uppercase tracking-wide text-slate-800 dark:text-slate-100">
            {title}
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// Reusable Button
const Button = ({ children, onClick, type = 'button', variant = 'primary', loading = false, icon = null }) => {
  const base = "px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all disabled:opacity-60";
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm",
    secondary: "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
    danger: "bg-rose-500 hover:bg-rose-600 text-white"
  };
  return (
    <button type={type} onClick={onClick} disabled={loading} className={`${base} ${variants[variant]}`}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
};