import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Bell, Mail, Shield, Check, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';

export default function MobileNotificationSettings() {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/m/login', { state: { from: '/m/notifications' } });
            return;
        }

        Promise.all([
            api.get('/profile'),
            api.get('/settings/public')
        ]).then(([profileRes, settingsRes]) => {
            setUser(profileRes.data);
            setSettings(settingsRes.data);
        }).catch(err => {
            if (err.response?.status === 401) {
                navigate('/m/login');
            }
        }).finally(() => setLoading(false));
    }, [navigate]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleToggleNotification = async () => {
        setSaving(true);
        try {
            const newVal = user.email_notification_enabled ? 0 : 1;
            await api.put('/profile/notification-settings', { email_notification_enabled: newVal });
            setUser(prev => ({ ...prev, email_notification_enabled: newVal }));
            showMessage('success', newVal ? '已开启邮件通知' : '已关闭邮件通知');
        } catch (err) {
            showMessage('error', '设置失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading variant="fullscreen" />;
    }

    const isFeatureEnabled = settings.email_notifications_feature_enabled;

    return (
        <div className="mobile-page bg-slate-50">
            {/* Header */}
            <header className="mobile-settings-header">
                <Link to="/m/profile" className="mobile-back-btn">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">通知设置</h1>
                <div className="w-8" />
            </header>

            {/* Message */}
            {message.text && (
                <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Email Status */}
                <div className="mobile-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Mail size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-800">邮箱状态</div>
                            <div className="text-sm text-slate-500">{user?.email || '未绑定邮箱'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {user?.email_verified ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
                                <Shield size={12} /> 已验证
                            </span>
                        ) : user?.email ? (
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full">未验证</span>
                        ) : (
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">请先绑定邮箱</span>
                        )}
                    </div>
                </div>

                {/* Email Notification Toggle */}
                {isFeatureEnabled ? (
                    <div className="mobile-card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Bell size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">邮件通知</div>
                                    <div className="text-xs text-slate-500 mt-0.5">管理员回复时发送邮件通知</div>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleNotification}
                                disabled={saving || !user?.email_verified}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${user?.email_notification_enabled ? 'bg-indigo-500' : 'bg-slate-300'
                                    } ${!user?.email_verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${user?.email_notification_enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                        {!user?.email_verified && (
                            <p className="text-xs text-amber-600 mt-3 pl-13">需要先验证邮箱才能开启此功能</p>
                        )}
                    </div>
                ) : (
                    <div className="mobile-card text-center py-8">
                        <Bell size={40} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500">邮件通知功能未开启</p>
                        <p className="text-xs text-slate-400 mt-1">请联系管理员开启此功能</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="mobile-card bg-blue-50 border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 通知说明</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 开启后，管理员回复您的工单时会发送邮件通知</li>
                        <li>• 需要绑定并验证邮箱后才能接收通知</li>
                        <li>• 您可以随时关闭此功能</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
