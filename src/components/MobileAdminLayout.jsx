import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, BarChart3, Users, Settings, Eye } from 'lucide-react';

// Navigation items for admin bottom bar
const getNavItems = (isSuperAdmin) => {
    const items = [
        { path: '/m/admin', label: '管理', icon: ClipboardList, exact: true },
        { path: '/m/admin/review', label: '审核', icon: Eye },
        { path: '/m/admin/data', label: '数据', icon: BarChart3 },
        { path: '/m/admin/users', label: '用户', icon: Users },
    ];

    // Only show "更多" for super_admin
    if (isSuperAdmin) {
        items.push({ path: '/m/admin/more', label: '更多', icon: Settings });
    }

    return items;
};

export default function MobileAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    // Check if user is logged in and is an admin
    React.useEffect(() => {
        if (!user) {
            navigate('/m/login', { state: { from: '/m/admin' } });
            return;
        }

        if (user.role !== 'admin' && user.role !== 'super_admin') {
            // Not an admin, redirect to home
            navigate('/m');
            return;
        }
    }, [user, navigate]);

    // Don't render if not admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null;
    }

    const isSuperAdmin = user.role === 'super_admin';
    const navItems = getNavItems(isSuperAdmin);

    // Get current path to check if we should show the back to home button
    // We only show it on main tabs, not on sub-pages (which have their own back buttons)
    const currentPath = location.pathname;
    const mainTabs = [
        '/m/admin',
        '/m/admin/review',
        '/m/admin/data',
        '/m/admin/users',
        '/m/admin/more'
    ];
    // Check if exact match or index path (for /m/admin)
    const isMainTab = mainTabs.includes(currentPath) || (currentPath === '/m/admin/');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-20">
            {/* Styles for Home Button Adjustment */}
            {isMainTab && (
                <style>{`
                    .mobile-admin-header {
                        padding-left: 52px !important;
                    }
                `}</style>
            )}

            {/* Back to Home Button - Only on main tabs */}
            {isMainTab && (
                <button
                    onClick={() => navigate('/m')}
                    className="fixed top-3 left-4 z-[60] w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md text-slate-600 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all"
                    style={{ marginTop: '1px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </button>
            )}
            {/* Page Content */}
            <main className="mobile-content">
                <Outlet />
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="mobile-bottom-nav">
                <div className="mobile-nav-container">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `mobile-nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`mobile-nav-icon ${isActive ? 'active' : ''}`}>
                                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className={`mobile-nav-label ${isActive ? 'active' : ''}`}>
                                            {item.label}
                                        </span>
                                        {isActive && <div className="mobile-nav-indicator" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
