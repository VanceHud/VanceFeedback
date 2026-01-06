
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Mail, KeyRound, Shield, Eye, EyeOff, Save, Check, Send, User, Lock, ArrowLeft, AlertCircle
} from 'lucide-react';
import Loading from '../components/Loading';

export default function UserCenter({ embedded = false }) {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Form states
    const [nickname, setNickname] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [emailStep, setEmailStep] = useState('input'); // 'input', 'verify', 'confirm'
    const [originalEmailCode, setOriginalEmailCode] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMethod, setPasswordMethod] = useState('password'); // 'password' or 'email'
    const [passwordEmailCode, setPasswordEmailCode] = useState('');
    const [showPasswords, setShowPasswords] = useState({});

    const [message, setMessage] = useState({ type: '', text: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [codeSending, setCodeSending] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, settingsRes] = await Promise.all([
                api.get('/profile'),
                api.get('/settings/public')
            ]);
            setUser(profileRes.data);
            setNickname(profileRes.data.nickname || profileRes.data.username);
            setSettings(settingsRes.data);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleUpdateNickname = async () => {
        if (!nickname.trim()) {
            showMessage('error', '昵称不能为空');
            return;
        }
        setActionLoading(true);
        try {
            await api.put('/profile/nickname', { nickname: nickname.trim() });
            showMessage('success', '昵称修改成功');
            fetchData();
        } catch (err) {
            showMessage('error', err.response?.data?.error || '修改失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendOriginalEmailCode = async () => {
        setCodeSending(true);
        try {
            await api.post('/profile/email/send-code', { verifyOriginal: true });
            showMessage('success', '验证码已发送到原邮箱');
            setEmailStep('verify');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '发送失败');
        } finally {
            setCodeSending(false);
        }
    };

    const handleSendNewEmailCode = async () => {
        if (!newEmail) {
            showMessage('error', '请输入新邮箱');
            return;
        }
        setCodeSending(true);
        try {
            await api.post('/profile/email/send-code', { email: newEmail });
            showMessage('success', '验证码已发送到新邮箱');
            setEmailStep('confirm');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '发送失败');
        } finally {
            setCodeSending(false);
        }
    };

    const handleVerifyOriginalEmail = async () => {
        if (!originalEmailCode) {
            showMessage('error', '请输入验证码');
            return;
        }
        // Just move to next step - actual verification happens on submit
        setEmailStep('newEmail');
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || !emailCode) {
            showMessage('error', '请填写完整信息');
            return;
        }
        setActionLoading(true);
        try {
            const data = { email: newEmail, code: emailCode };
            if (!user.email || !user.email_verified) {
                data.password = currentPassword;
            }
            await api.put('/profile/email', data);
            showMessage('success', '邮箱修改成功');
            setEmailStep('input');
            setNewEmail('');
            setEmailCode('');
            setOriginalEmailCode('');
            fetchData();
        } catch (err) {
            showMessage('error', err.response?.data?.error || '修改失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendPasswordEmailCode = async () => {
        setCodeSending(true);
        try {
            await api.post('/verification/send-code', {
                email: user.email,
                type: 'password_reset',
                userId: user.id
            });
            showMessage('success', '验证码已发送');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '发送失败');
        } finally {
            setCodeSending(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword) {
            showMessage('error', '请输入新密码');
            return;
        }
        if (newPassword.length < 6) {
            showMessage('error', '新密码至少6个字符');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('error', '两次密码输入不一致');
            return;
        }

        setActionLoading(true);
        try {
            const data = { newPassword };
            if (passwordMethod === 'password') {
                data.currentPassword = currentPassword;
            } else {
                data.emailCode = passwordEmailCode;
            }
            await api.put('/profile/password', data);
            showMessage('success', '密码修改成功');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordEmailCode('');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '修改失败');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (loading) {
        return <Loading variant={embedded ? 'section' : 'fullscreen'} />;
    }

    return (
        <div className={embedded ? "animate-fade-in" : "min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-8"}>
            <div className={embedded ? "" : "max-w-3xl mx-auto"}>
                {/* Header */}
                <div className="mb-6">
                    {!embedded && (
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-4">
                            <ArrowLeft size={20} />
                            返回控制台
                        </Link>
                    )}
                    <h1 className={embedded ? "text-2xl font-bold text-slate-800 flex items-center gap-2" : "text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"}>
                        {embedded && <span>👤</span>} 用户中心
                    </h1>
                    <p className="text-slate-500 mt-2">管理您的账户信息和安全设置</p>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mb - 6 p - 4 rounded - xl flex items - center gap - 3 animate - fade -in ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        } `}>
                        {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-card border border-slate-100 mb-6">
                    {['profile', 'email', 'password'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex - 1 py - 3 px - 4 rounded - xl font - medium transition - all flex items - center justify - center gap - 2 ${activeTab === tab
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                    : 'text-slate-600 hover:bg-slate-50'
                                } `}
                        >
                            {tab === 'profile' && <User size={18} />}
                            {tab === 'email' && <Mail size={18} />}
                            {tab === 'password' && <Lock size={18} />}
                            {tab === 'profile' && '个人信息'}
                            {tab === 'email' && '邮箱设置'}
                            {tab === 'password' && '修改密码'}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {(user.nickname || user.username)?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-800">{user.nickname || user.username}</div>
                                <div className="text-slate-500 text-sm">@{user.username}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px - 2 py - 0.5 rounded - full text - xs font - medium ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                        } `}>
                                        {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '用户'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {settings.email_notifications_feature_enabled && (
                                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                                            <Mail size={18} className="text-slate-500" />
                                            邮件通知
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">当管理员回复您的工单时接收邮件通知</p>
                                    </div>
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            setActionLoading(true);
                                            try {
                                                const newVal = user.email_notification_enabled ? 0 : 1;
                                                await api.put('/profile/notification-settings', { email_notification_enabled: newVal });
                                                setUser(prev => ({ ...prev, email_notification_enabled: newVal }));
                                                showMessage('success', newVal ? '已开启邮件通知' : '已关闭邮件通知');
                                            } catch (err) {
                                                showMessage('error', '设置失败，请稍后重试');
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className={`relative inline - flex h - 6 w - 11 items - center rounded - full transition - colors ${user.email_notification_enabled ? 'bg-indigo-500' : 'bg-slate-300'} `}
                                    >
                                        <span className={`inline - block h - 4 w - 4 transform rounded - full bg - white transition - transform ${user.email_notification_enabled ? 'translate-x-6' : 'translate-x-1'} `} />
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">昵称</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="输入昵称"
                                    />
                                    <button
                                        onClick={handleUpdateNickname}
                                        disabled={actionLoading}
                                        className="btn-primary px-6 py-3 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        保存
                                    </button>
                                </div>
                            </div>

                            {user.student_id && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">学号</label>
                                    <input
                                        type="text"
                                        value={user.student_id}
                                        disabled
                                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 text-slate-600"
                                    />
                                </div>
                            )}

                            {user.real_name && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">姓名</label>
                                    <input
                                        type="text"
                                        value={user.real_name}
                                        disabled
                                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 bg-slate-50 text-slate-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Email Tab */}
                {activeTab === 'email' && settings.email_verification_enabled && (
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 space-y-6">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="text-sm text-slate-500">当前邮箱</div>
                            <div className="font-medium text-slate-800 flex items-center gap-2 mt-1">
                                {user.email || '未绑定'}
                                {user.email_verified ? (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Shield size={12} /> 已验证
                                    </span>
                                ) : user.email && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">未验证</span>
                                )}
                            </div>
                        </div>

                        {/* If user has verified email, need to verify original first */}
                        {user.email && user.email_verified && emailStep === 'input' && (
                            <div className="space-y-4">
                                <p className="text-slate-600">修改邮箱前需要验证原邮箱</p>
                                <button
                                    onClick={handleSendOriginalEmailCode}
                                    disabled={codeSending}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                >
                                    {codeSending ? <Loading variant="inline" /> : <Send size={18} />}
                                    发送验证码到原邮箱
                                </button>
                            </div>
                        )}

                        {emailStep === 'verify' && (
                            <div className="space-y-4">
                                <p className="text-slate-600">请输入发送到 {user.email} 的验证码</p>
                                <input
                                    type="text"
                                    value={originalEmailCode}
                                    onChange={e => setOriginalEmailCode(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <button
                                    onClick={handleVerifyOriginalEmail}
                                    className="btn-primary w-full py-3"
                                >
                                    验证
                                </button>
                            </div>
                        )}

                        {(emailStep === 'newEmail' || (!user.email || !user.email_verified) && emailStep === 'input') && (
                            <div className="space-y-4">
                                {!user.email && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">验证密码</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="输入当前密码"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">新邮箱地址</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="输入新邮箱"
                                        />
                                        <button
                                            onClick={handleSendNewEmailCode}
                                            disabled={codeSending}
                                            className="btn-secondary px-4 py-3 flex items-center gap-2"
                                        >
                                            {codeSending ? <Loading variant="inline" /> : <Send size={16} />}
                                            发送验证码
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {emailStep === 'confirm' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">验证码</label>
                                    <input
                                        type="text"
                                        value={emailCode}
                                        onChange={e => setEmailCode(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateEmail}
                                    disabled={actionLoading}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loading variant="inline" /> : <Check size={18} />}
                                    确认修改
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'email' && !settings.email_verification_enabled && (
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 text-center">
                        <Mail size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">邮箱功能未开启</p>
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 space-y-6">
                        {user.email && user.email_verified && settings.email_verification_enabled && (
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setPasswordMethod('password')}
                                    className={`flex - 1 py - 2.5 rounded - lg font - medium transition - all flex items - center justify - center gap - 2 ${passwordMethod === 'password' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
                                        } `}
                                >
                                    <KeyRound size={16} />
                                    使用原密码
                                </button>
                                <button
                                    onClick={() => setPasswordMethod('email')}
                                    className={`flex - 1 py - 2.5 rounded - lg font - medium transition - all flex items - center justify - center gap - 2 ${passwordMethod === 'email' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
                                        } `}
                                >
                                    <Mail size={16} />
                                    使用邮箱验证
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {passwordMethod === 'password' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">当前密码</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="输入当前密码"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword('current')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {passwordMethod === 'email' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">邮箱验证码</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={passwordEmailCode}
                                            onChange={e => setPasswordEmailCode(e.target.value)}
                                            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="输入验证码"
                                        />
                                        <button
                                            onClick={handleSendPasswordEmailCode}
                                            disabled={codeSending}
                                            className="btn-secondary px-4 py-3 flex items-center gap-2"
                                        >
                                            {codeSending ? <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /> : <Send size={16} />}
                                            发送
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">新密码</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="输入新密码（至少6位）"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleShowPassword('new')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">确认新密码</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="再次输入新密码"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleShowPassword('confirm')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdatePassword}
                                disabled={actionLoading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loading variant="inline" /> : <Save size={18} />}
                                确认修改
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
