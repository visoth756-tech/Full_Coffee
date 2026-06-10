
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toggleTheme } from '../features/themeSlice';
import { logout } from '../features/authSlice';
import {
    Coffee, LayoutDashboard, Users, FolderTree,
    ShoppingBag, BarChart3, Settings, User, LogOut, Sun, Moon
} from 'lucide-react';

export default function MainLayout({ children }) {
    const { darkMode } = useSelector((state) => state.theme);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
        { name: 'Users Management', path: '/users', icon: Users, adminOnly: true },
        { name: 'Categories', path: '/categories', icon: FolderTree, adminOnly: false },
        { name: 'Products', path: '/products', icon: ShoppingBag, adminOnly: false },
        { name: 'POS / Order', path: '/orders', icon: Coffee, adminOnly: false },
        { name: 'Reports', path: '/reports', icon: BarChart3, adminOnly: false },
        { name: 'Settings', path: '/settings', icon: Settings, adminOnly: false },
        { name: 'Profile', path: '/profile', icon: User, adminOnly: false },
    ];

    return (
        <div className={`${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'} min-h-screen flex transition-colors duration-300`}>
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between p-4 z-10">
                <div>
                    {/* Logo Brand */}
                    <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-100 dark:border-slate-700 mb-6">
                        <div className="p-2 bg-amber-600 rounded-xl text-white">
                            <Coffee size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Samurai Coffee</h1>
                            <span className="text-xs text-slate-400">POS System v1.0</span>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            if (item.adminOnly && user?.role !== 'admin') return null;
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer Controls */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <div className="flex items-center gap-3">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full bg-slate-300 dark:bg-amber-600 relative p-0.5 transition-colors`}>
                            <div className={`w-3 h-3 rounded-full bg-white transform duration-200 ${darkMode ? 'translate-x-4' : ''}`} />
                        </div>
                    </button>

                    {/* Logout Action */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Window */}
            <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-400">Welcome back,</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{user?.name || 'Barista'} ({user?.role || 'User'})</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-200 dark:border-amber-800">
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                </header>

                {/* View Injector */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}