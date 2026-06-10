import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    ShoppingBag, Plus, Edit2, Trash2, Loader2, CheckCircle,
    AlertTriangle, X, Camera, Search, Filter, ChevronLeft,
    ChevronRight, Package, RefreshCw, Coffee
} from 'lucide-react';
import api from '../api/axios';

export default function Products() {
    const { token } = useSelector((state) => state.auth);

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form fields
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [deletingProduct, setDeletingProduct] = useState(null);

    // Notifications
    const [noticeMessage, setNoticeMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            const prodList = prodRes.data?.list || prodRes.data || [];
            const catList = catRes.data?.list || catRes.data || [];
            setProducts(prodList);
            setCategories(catList);
            setLastUpdated(new Date());
        } catch (err) {
            setErrorMessage('Failed to load product catalog. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter products
    useEffect(() => {
        let result = [...products];
        if (selectedCategoryFilter !== 'all') {
            result = result.filter(p => Number(p.category_id) === Number(selectedCategoryFilter));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }
        setFilteredProducts(result);
        setCurrentPage(1);
    }, [searchQuery, selectedCategoryFilter, products]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryId) {
            setErrorMessage('Please select a category.');
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            setErrorMessage('Price must be greater than zero.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        setNoticeMessage('');

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', description.trim());
        formData.append('category_id', categoryId);
        formData.append('price', price);
        if (selectedFile) formData.append('image', selectedFile);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token || localStorage.getItem('token')}`
            }
        };

        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, formData, config);
                setNoticeMessage('Product updated successfully.');
            } else {
                await api.post('/products', formData, config);
                setNoticeMessage('New product added to catalog.');
            }
            closeModals();
            fetchData();
            setTimeout(() => setNoticeMessage(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message;
            setErrorMessage(msg || 'Operation failed. Check your permissions.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/products/${deletingProduct.product_id}`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setNoticeMessage(`"${deletingProduct.name}" removed from inventory.`);
            setIsDeleteModalOpen(false);
            setDeletingProduct(null);
            fetchData();
            setTimeout(() => setNoticeMessage(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message;
            setErrorMessage(msg || 'Cannot delete product that may have existing orders.');
            setIsDeleteModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setCategoryId('');
        setPrice('');
        setSelectedFile(null);
        setImagePreview(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingId(product.product_id);
        setName(product.name || '');
        setDescription(product.description || '');
        setCategoryId(product.category_id?.toString() || '');
        setPrice(product.price?.toString() || '');
        setSelectedFile(null);
        setImagePreview(product.image_url || null);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (product) => {
        setDeletingProduct(product);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setEditingId(null);
        setDeletingProduct(null);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategoryFilter('all');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                        Coffee Menu
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage your coffee creations · {filteredProducts.length} of {products.length} items shown
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                    <Plus size={16} /> New Brew
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                        <option value="all">All coffee types</option>
                        {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id} className="capitalize">
                                {cat.category_name}
                            </option>
                        ))}
                    </select>
                </div>
                {(searchQuery || selectedCategoryFilter !== 'all') && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
                    >
                        <RefreshCw size={12} /> Clear filters
                    </button>
                )}
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

            {/* Product Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                            <div className="h-52 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="p-5 space-y-3">
                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : paginatedProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-12 text-center">
                    <Coffee size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-500">
                        {searchQuery || selectedCategoryFilter !== 'all'
                            ? 'No coffee matches your filters.'
                            : 'No coffee items yet. Create your first brew!'}
                    </p>
                    {(searchQuery || selectedCategoryFilter !== 'all') && (
                        <button
                            onClick={clearFilters}
                            className="mt-3 text-xs font-bold text-amber-600 hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedProducts.map((product) => {
                            const categoryName = categories.find(c => c.category_id === product.category_id)?.category_name || 'Uncategorized';
                            return (
                                <div
                                    key={product.product_id}
                                    className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                                >
                                    {/* Image container with warm gradient overlay */}
                                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-amber-50 dark:bg-slate-700">
                                                <Coffee size={48} className="text-amber-300 dark:text-amber-600" />
                                            </div>
                                        )}
                                        {/* Overlay gradient for better text contrast */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Category pill - top right */}
                                        <span className="absolute top-3 right-3 backdrop-blur-md bg-white/30 dark:bg-black/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                                            {categoryName}
                                        </span>

                                        {/* Price tag with bean icon - bottom left */}
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                                            <span className="text-amber-300 text-xs">☕</span>
                                            <span className="text-white font-mono font-bold text-sm">${parseFloat(product.price).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Card content */}
                                    <div className="p-5 relative z-10">
                                        <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100 capitalize leading-tight mb-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem] font-medium">
                                            {product.description || 'A delightful coffee experience waiting for you.'}
                                        </p>

                                        {/* Decorative divider */}
                                        <div className="my-3 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

                                        {/* Action buttons with coffee-themed tooltips */}
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="relative p-2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all duration-200 group/edit"
                                                title="Edit recipe"
                                            >
                                                <Edit2 size={14} />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap">
                                                    Customize
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(product)}
                                                className="relative p-2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all duration-200 group/del"
                                                title="Remove from menu"
                                            >
                                                <Trash2 size={14} />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover/del:opacity-100 transition-opacity whitespace-nowrap">
                                                    Discard
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hover border glow effect */}
                                    <div className="absolute inset-0 rounded-2xl pointer-events-none ring-0 group-hover:ring-2 group-hover:ring-amber-400/50 transition-all duration-300" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/60">
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

            {lastUpdated && (
                <div className="text-right text-[10px] text-slate-400">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {isFormModalOpen && (
                <Modal onClose={closeModals} title={editingId ? 'Edit Coffee' : 'New Coffee'} icon={<Coffee size={18} />}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Image upload */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coffee photo</label>
                            <label className="relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer bg-slate-50 dark:bg-slate-900 hover:border-amber-500 transition-all overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-slate-400">
                                        <Camera size={24} />
                                        <span className="text-xs font-medium">Upload image</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coffee name</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Caramel Macchiato"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 cursor-pointer capitalize"
                            >
                                <option value="">Select a coffee type</option>
                                {categories.map(cat => (
                                    <option key={cat.category_id} value={cat.category_id} className="capitalize">
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                            <textarea
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the coffee (flavor notes, origin, preparation...)"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
                            <Button type="submit" loading={isSubmitting} icon={editingId ? <Edit2 size={14} /> : <Plus size={14} />}>
                                {editingId ? 'Save changes' : 'Add to menu'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && deletingProduct && (
                <Modal onClose={closeModals} title="Remove from menu" icon={<AlertTriangle size={18} />} danger>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Are you sure you want to permanently remove <strong className="text-rose-600">{deletingProduct.name}</strong> from your coffee menu? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
                            <Button variant="danger" onClick={handleDelete} loading={isSubmitting} icon={<Trash2 size={14} />}>
                                Remove item
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ================== Reusable Components ==================
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