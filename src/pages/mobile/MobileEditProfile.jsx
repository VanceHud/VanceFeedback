import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, User, Save, Mail, Shield, Check, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';

export default function MobileEditProfile() {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/m/login', { state: { from: '/m/edit-profile' } });
            return;
        }

        Promise.all([
            api.get('/profile'),
            api.get('/settings/public')
        ]).then(([profileRes, settingsRes]) => {
            setUser(profileRes.data);
            setNickname(profileRes.data.nickname || profileRes.data.username);
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

    const handleSave = async () => {
        if (!nickname.trim()) {
            showMessage('error', '昵称不能为空');
            return;
        }

        setSaving(true);
        try {
            await api.put('/profile/nickname', { nickname: nickname.trim() });
            showMessage('success', '保存成功');
            // Update local storage
            const userData = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...userData, nickname: nickname.trim() }));
        } catch (err) {
            showMessage('error', err.response?.data?.error || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleNotification = async () => {
        if (!settings.email_notifications_feature_enabled) return;

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

    return (
        <div className="mobile-page bg-slate-50">
            {/* Header */}
            <header className="mobile-settings-header">
                <Link to="/m/profile" className="mobile-back-btn">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">编辑资料</h1>
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
                {/* Avatar Section */}
                <div className="mobile-card">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {(nickname || user?.username)?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-lg text-slate-800">{nickname || user?.username}</div>
                            <div className="text-slate-500 text-sm">@{user?.username}</div>
                        </div>
                    </div>
                </div>

                {/* Edit Nickname */}
                <div className="mobile-card">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <User size={14} className="inline mr-2" />
                        昵称
                    </label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm input-focus"
                        placeholder="输入昵称"
                    />
                </div>

                {/* Read-only info */}
                {user?.student_id && (
                    <div className="mobile-card">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">学号</label>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 text-slate-600 text-sm">
                            {user.student_id}
                        </div>
                    </div>
                )}

                {user?.real_name && (
                    <div className="mobile-card">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">姓名</label>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 text-slate-600 text-sm">
                            {user.real_name}
                        </div>
                    </div>
                )}

                {/* Email Info */}
                <div className="mobile-card">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Mail size={14} className="inline mr-2" />
                        邮箱
                    </label>
                    <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-slate-600 text-sm">{user?.email || '未绑定'}</span>
                        {user?.email_verified ? (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Shield size={10} /> 已验证
                            </span>
                        ) : user?.email && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">未验证</span>
                        )}
                    </div>
                </div>

                {/* Email Notification Toggle */}
                {settings.email_notifications_feature_enabled && (
                    <div className="mobile-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-slate-800 text-sm">邮件通知</div>
                                <p className="text-xs text-slate-500 mt-1">管理员回复时接收邮件通知</p>
                            </div>
                            <button
                                onClick={handleToggleNotification}
                                disabled={saving}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user?.email_notification_enabled ? 'bg-indigo-500' : 'bg-slate-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.email_notification_enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <Loading variant="inline" text="保存中..." className="text-white" />
                    ) : (
                        <>
                            <Save size={18} />
                            保存修改
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
