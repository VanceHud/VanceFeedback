import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { User, Mail, Phone, LogOut, Settings, Shield, ChevronRight, Bell, Key, Edit3 } from 'lucide-react';
import Loading from '../../components/Loading';
import Skeleton from '../../components/Skeleton';

export default function MobileProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [universityName, setUniversityName] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/m/login', { state: { from: '/m/profile' } });
            return;
        }

        // Load profile
        api.get('/profile').then(res => {
            setProfile(res.data);
        }).catch(console.error).finally(() => setLoading(false));

        // Load university name
        api.get('/settings/public').then(res => {
            if (res.data.university_name) setUniversityName(res.data.university_name);
        }).catch(console.error);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/m/login');
    };

    if (!user) return null;

    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    const menuItems = [
        { icon: Edit3, label: '编辑资料', path: '/m/edit-profile', color: 'text-blue-500' },
        { icon: Key, label: '修改密码', path: '/m/change-password', color: 'text-purple-500' },
        { icon: Bell, label: '通知设置', path: '/m/notifications', color: 'text-orange-500' },
    ];

    if (isAdmin) {
        menuItems.push(
            { icon: Settings, label: '管理后台', path: '/m/admin', color: 'text-indigo-500' }
        );
    }

    return (
        <div className="mobile-page">
            {/* Profile Header */}
            <div className="mobile-profile-header">
                <div className="mobile-profile-avatar">
                    {user.username?.charAt(0)?.toUpperCase()}
                </div>
                <div className="mobile-profile-info">
                    <h2 className="text-lg font-bold text-white">{user.username}</h2>
                    <p className="text-sm text-white/70">
                        {loading ? (
                            <Skeleton width={150} height={14} className="bg-white/20" />
                        ) : (
                            profile?.email || '暂无邮箱'
                        )}
                    </p>
                    {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                            <Shield size={10} />
                            {user.role === 'super_admin' ? '超级管理员' : '管理员'}
                        </span>
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className="px-4 -mt-6 relative z-10">
                {/* Stats Card */}
                {loading ? (
                    <div className="mobile-card mb-4">
                        <Loading variant="section" text="加载中..." />
                    </div>
                ) : (
                    <div className="mobile-card mb-4">
                        <div className="grid grid-cols-3 divide-x divide-slate-100">
                            <div className="text-center py-2">
                                <p className="text-xl font-bold text-indigo-600">{profile?.ticket_count || 0}</p>
                                <p className="text-xs text-slate-500">反馈总数</p>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-xl font-bold text-emerald-600">{profile?.resolved_count || 0}</p>
                                <p className="text-xs text-slate-500">已解决</p>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-xl font-bold text-orange-600">{profile?.pending_count || 0}</p>
                                <p className="text-xs text-slate-500">处理中</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="mobile-card mb-4">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors rounded-xl"
                            >
                                <div className={`w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center ${item.color}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                                <ChevronRight size={18} className="text-slate-300" />
                            </Link>
                        );
                    })}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full mobile-card flex items-center justify-center gap-2 p-4 text-red-500 font-medium hover:bg-red-50 transition-colors"
                >
                    <LogOut size={18} />
                    退出登录
                </button>

                {/* Footer */}
                <div className="text-center py-6 text-xs text-slate-400">
                    <p>{universityName} · 反馈系统</p>
                    <Link to="/about" className="text-indigo-500 hover:underline mt-1 inline-block">
                        关于我们
                    </Link>
                </div>
            </div>
        </div>
    );
}
