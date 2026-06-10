import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Users as UsersIcon, Plus, Edit2, Trash2, Loader2, CheckCircle,
    AlertTriangle, X, Shield, Mail, User, ShieldAlert, Search,
    Filter, ChevronLeft, ChevronRight, Info, Power, Clock
} from 'lucide-react';
import api from '../api/axios';

export default function Users() {
    const { token, user: currentUser } = useSelector((state) => state.auth);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // new filter: all, active, inactive

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleWarningOpen, setRoleWarningOpen] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState(null);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    // Active targets
    const [editingId, setEditingId] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    // Notifications
    const [noticeMessage, setNoticeMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await api.get('/users', {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            const arrayList = Array.isArray(response.data)
                ? response.data
                : (response.data.list || response.data.users || []);
            setUsers(arrayList);
            setTotalUsers(arrayList.length);
        } catch (err) {
            setErrorMessage('Failed to load staff directory. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Filtering + search + status
    useEffect(() => {
        let result = [...users];
        if (roleFilter !== 'all') {
            result = result.filter(u => u.role === roleFilter);
        }
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            result = result.filter(u => u.is_active === isActive);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.full_name || u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        }
        setFilteredUsers(result);
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter, users]);

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Toggle user active status
    const toggleUserStatus = async (user) => {
        if (user.user_id === currentUser?.user_id) {
            setErrorMessage("You cannot deactivate your own account.");
            return;
        }
        setUpdatingStatus(user.user_id);
        try {
            const newStatus = !user.is_active;
            await api.put(`/users/${user.user_id}`, { is_active: newStatus }, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setNoticeMessage(`${user.full_name || user.name} ${newStatus ? 'activated' : 'deactivated'}.`);
            fetchUsers();
            setTimeout(() => setNoticeMessage(''), 3000);
        } catch (err) {
            setErrorMessage(err.response?.data?.error || 'Failed to update user status.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                // Edit: only name and role (status managed via toggle)
                await api.put(`/users/${editingId}`, { full_name: fullName.trim(), role }, config);
                setNoticeMessage('Staff role updated successfully.');
                setIsEditModalOpen(false);
            } else {
                await api.post('/users/register', {
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role,
                    is_active: true 
                }, config);
                setNoticeMessage('New staff account created.');
                setIsAddModalOpen(false);
            }
            closeModals();
            fetchUsers();
            setTimeout(() => setNoticeMessage(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message;
            setErrorMessage(msg || 'Operation failed. Check permissions.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;
        if (deletingUser.user_id === currentUser?.user_id) {
            setErrorMessage('You cannot delete your own account.');
            setIsDeleteModalOpen(false);
            setDeletingUser(null);
            return;
        }
        setIsSubmitting(true);
        try {
            await api.delete(`/users/${deletingUser.user_id}`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setNoticeMessage(`User "${deletingUser.full_name}" removed.`);
            setIsDeleteModalOpen(false);
            setDeletingUser(null);
            fetchUsers();
            setTimeout(() => setNoticeMessage(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message;
            setErrorMessage(msg || 'Cannot delete this user at this time.');
            setIsDeleteModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setEditingId(user.user_id);
        setFullName(user.full_name || user.name || '');
        setRole(user.role || 'user');
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setRoleWarningOpen(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('user');
        setEditingId(null);
        setDeletingUser(null);
        setPendingRoleChange(null);
    };

    const handleRoleChange = (newRole) => {
        const targetUser = users.find(u => u.user_id === editingId);
        if (targetUser && targetUser.role !== newRole) {
            if (targetUser.role === 'admin' || newRole === 'admin') {
                setPendingRoleChange(newRole);
                setRoleWarningOpen(true);
                return;
            }
        }
        setRole(newRole);
    };

    const confirmRoleChange = () => {
        if (pendingRoleChange !== null) {
            setRole(pendingRoleChange);
            setRoleWarningOpen(false);
            setPendingRoleChange(null);
        }
    };

    const formatLastLogin = (lastLogin) => {
        if (!lastLogin) return 'Never';
        const date = new Date(lastLogin);
        return date.toLocaleString();
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                        User Management
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manage system access, roles & status · {totalUsers} active {totalUsers === 1 ? 'user' : 'users'}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                    <Plus size={16} /> Add Staff
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                        <option value="all">All roles</option>
                        <option value="admin">Administrators</option>
                        <option value="user">Baristas</option>
                    </select>
                </div>
                <div className="relative">
                    <Power className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                        <option value="all">All status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
                    >
                        Clear filters
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

            {/* Users Table / Card Layout */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginatedUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No users match your filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/40 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Last Login</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                                    {paginatedUsers.map((user) => {
                                        const name = user.full_name || user.name || 'Staff';
                                        const isSelf = currentUser?.user_id === user.user_id;
                                        const isActive = user.is_active === true;
                                        const lastLogin = formatLastLogin(user.last_login);
                                        return (
                                            <tr key={user.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-sm">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">{name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">ID: {user.user_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${user.role === 'admin'
                                                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                                                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                                        }`}>
                                                        {user.role === 'admin' ? 'Admin' : 'Barista'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleUserStatus(user)}
                                                            disabled={isSelf || updatingStatus === user.user_id}
                                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                                } ${(isSelf || updatingStatus === user.user_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                                                                    }`}
                                                            />
                                                        </button>
                                                        <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} className="text-slate-400" />
                                                        {lastLogin}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                                                            title="Edit role"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            disabled={isSelf}
                                                            className={`p-2 rounded-lg border transition-all ${isSelf
                                                                ? 'border-slate-200 text-slate-300 cursor-not-allowed dark:border-slate-700'
                                                                : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:border-slate-700'
                                                                }`}
                                                            title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                            {paginatedUsers.map((user) => {
                                const name = user.full_name || user.name || 'Staff';
                                const isSelf = currentUser?.user_id === user.user_id;
                                const isActive = user.is_active === true;
                                const lastLogin = formatLastLogin(user.last_login);
                                return (
                                    <div key={user.user_id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold">
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">{name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${user.role === 'admin'
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                {user.role === 'admin' ? 'Admin' : 'Barista'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    disabled={isSelf || updatingStatus === user.user_id}
                                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                        }`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                                                        }`} />
                                                </button>
                                                <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> {lastLogin}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(user)}
                                                disabled={isSelf}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1 ${isSelf
                                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                    }`}
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <Modal onClose={closeModals} title="Register new staff" icon={<UsersIcon size={18} />}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField icon={User} label="Full name" value={fullName} onChange={setFullName} required autoFocus />
                        <InputField icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} required />
                        <InputField icon={LockIcon} label="Password" type="password" value={password} onChange={setPassword} required />
                        <SelectField label="Role" value={role} onChange={setRole} options={[
                            { value: 'user', label: 'Barista (User)' },
                            { value: 'admin', label: 'Administrator (Manager)' }
                        ]} />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
                            <Button type="submit" loading={isSubmitting} icon={<Plus size={14} />}>Create account</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <Modal onClose={closeModals} title="Edit staff role" icon={<Shield size={18} />}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField icon={User} label="Full name" value={fullName} onChange={setFullName} required />
                        <SelectField label="Role" value={role} onChange={handleRoleChange} options={[
                            { value: 'user', label: 'Barista (User)' },
                            { value: 'admin', label: 'Administrator (Manager)' }
                        ]} />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
                            <Button type="submit" loading={isSubmitting} icon={<Edit2 size={14} />}>Save changes</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && deletingUser && (
                <Modal onClose={closeModals} title="Revoke access" icon={<ShieldAlert size={18} />} danger>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Are you sure you want to permanently remove <strong className="text-rose-600">{deletingUser.full_name || deletingUser.name}</strong>?
                            {deletingUser.role === 'admin' && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                    ⚠️ This user is an administrator. Their access will be fully revoked.
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
                            <Button variant="danger" onClick={handleDelete} loading={isSubmitting} icon={<Trash2 size={14} />}>
                                Delete user
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Role change warning modal */}
            {roleWarningOpen && (
                <Modal onClose={() => setRoleWarningOpen(false)} title="Confirm role change" icon={<AlertTriangle size={18} />} danger>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Changing this user's role may affect their permissions dramatically.
                            {pendingRoleChange === 'admin' ? (
                                <span className="block mt-2 text-amber-600">Promoting to admin grants full system control.</span>
                            ) : (
                                <span className="block mt-2 text-rose-600">Demoting from admin will remove all admin privileges.</span>
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setRoleWarningOpen(false)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmRoleChange}>Confirm change</Button>
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

const InputField = ({ icon: Icon, label, type = 'text', value, onChange, required, autoFocus = false }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                autoFocus={autoFocus}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all"
            />
        </div>
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
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

const LockIcon = () => <svg className="lucide lucide-lock" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;