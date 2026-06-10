import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toggleTheme } from '../features/themeSlice';
import { logout } from '../features/authSlice';
import {
    Coffee, LayoutDashboard, Users, FolderTree,
    ShoppingBag, BarChart3, Settings, User, LogOut, Sun, Moon
} from 'lucide-react';
import api from '../api/axios';

// ------------------------------------------------------------
// AUTO-LOGOUT HOOK – checks user status every 2 minutes
// ------------------------------------------------------------
const useUserStatus = (checkIntervalMs = 120000) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);
    const intervalRef = useRef(null);

    const checkStatus = async () => {
        if (!token || !user?.user_id) return;
        try {
            const response = await api.get(`/users/${user.user_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.is_active === false) {
                dispatch(logout());
                navigate('/login', { state: { message: 'Your account has been deactivated. Please contact admin.' } });
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                dispatch(logout());
                navigate('/login', { state: { message: 'Session expired or access revoked.' } });
            }
        }
    };

    useEffect(() => {
        if (token && user) {
            checkStatus();
            intervalRef.current = setInterval(checkStatus, checkIntervalMs);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [token, user]);
};

// ------------------------------------------------------------
// MAIN LAYOUT COMPONENT
// ------------------------------------------------------------
export default function SidebarLayout({ children }) {
    const { darkMode } = useSelector((state) => state.theme);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Activate auto-logout when user is deactivated
    useUserStatus();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Sidebar navigation items
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
        { name: 'Users Management', path: '/users', icon: Users, adminOnly: true },
        { name: 'Categories', path: '/categories', icon: FolderTree, adminOnly: false },
        { name: 'Products', path: '/products', icon: ShoppingBag, adminOnly: false },
        { name: 'POS / Orders', path: '/orders', icon: Coffee, adminOnly: false },
        { name: 'Reports', path: '/reports', icon: BarChart3, adminOnly: false },
        { name: 'Settings', path: '/settings', icon: Settings, adminOnly: false },
        { name: 'Profile', path: '/profile', icon: User, adminOnly: false },
    ];

    const displayName = user?.full_name || user?.name || 'Samurai Barista';
    const displayImage = user?.image_url || user?.image || null;
    const displayRole = user?.role || 'user';

    return (
        <div className={`${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} min-h-screen flex transition-colors duration-300 font-sans`}>

            {/* ================= SIDEBAR ================= */}
            <aside className="w-64 fixed inset-y-0 left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/60 flex flex-col justify-between p-4 z-30 transition-all shadow-sm">
                <div>
                    {/* Brand Header */}
                    <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 dark:border-slate-700/50 mb-6">
                        <div className="p-2.5 bg-gradient-to-tr from-amber-700 to-amber-500 rounded-xl text-white shadow-md shadow-amber-600/20">
                            <Coffee size={22} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="font-black text-base tracking-wide uppercase bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent dark:from-amber-400">
                                POS_COFFEE
                            </h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Samurai Front
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            if (item.adminOnly && displayRole !== 'admin') return null;
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                                        isActive
                                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 dark:bg-amber-500'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon
                                        size={19}
                                        className={`transition-transform duration-200 group-hover:scale-105 ${
                                            isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                                        }`}
                                    />
                                    <span>{item.name}</span>
                                    {item.adminOnly && (
                                        <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30">
                                            Admin
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 space-y-2">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={() => dispatch(toggleTheme())}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-500" />}
                            <span>{darkMode ? 'Light Shift' : 'Dark Shift'}</span>
                        </div>
                        <div className={`w-8 h-4.5 rounded-full relative p-0.5 transition-colors duration-200 ${darkMode ? 'bg-amber-500' : 'bg-slate-200'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform duration-200 ease-out ${darkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {/* Logout Button */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all group"
                    >
                        <LogOut size={19} className="text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT AREA ================= */}
            <div className="flex-1 pl-64 flex flex-col min-w-0">
                {/* Top Header Bar */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between px-8 sticky top-0 z-20 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Terminal:</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/30 capitalize tracking-wide">
                            {displayRole} Counter
                        </span>
                    </div>
                    <div className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-700">
                        <div className="text-right">
                            <p className="text-sm font-bold leading-tight capitalize text-slate-800 dark:text-slate-100">{displayName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{user?.email || 'counter@pos.com'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-sm overflow-hidden border border-amber-500/20">
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.target.style.display = 'none')}
                                />
                            ) : (
                                <span className="text-sm uppercase font-black tracking-tighter">{displayName.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}