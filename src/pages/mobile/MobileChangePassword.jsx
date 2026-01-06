import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Send, Check, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';

export default function MobileChangePassword() {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [codeSending, setCodeSending] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password method: 'password' or 'email'
    const [method, setMethod] = useState('password');
    const [currentPassword, setCurrentPassword] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/m/login', { state: { from: '/m/change-password' } });
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
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSendCode = async () => {
        setCodeSending(true);
        try {
            await api.post('/verification/send-code', {
                email: user.email,
                type: 'password_reset',
                userId: user.id
            });
            showMessage('success', '验证码已发送到您的邮箱');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '发送失败');
        } finally {
            setCodeSending(false);
        }
    };

    const handleSubmit = async () => {
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

        setSaving(true);
        try {
            const data = { newPassword };
            if (method === 'password') {
                if (!currentPassword) {
                    showMessage('error', '请输入当前密码');
                    setSaving(false);
                    return;
                }
                data.currentPassword = currentPassword;
            } else {
                if (!emailCode) {
                    showMessage('error', '请输入验证码');
                    setSaving(false);
                    return;
                }
                data.emailCode = emailCode;
            }

            await api.put('/profile/password', data);
            showMessage('success', '密码修改成功');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setEmailCode('');
        } catch (err) {
            showMessage('error', err.response?.data?.error || '修改失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading variant="fullscreen" />;
    }

    const canUseEmail = user?.email && user?.email_verified && settings.email_verification_enabled;

    return (
        <div className="mobile-page bg-slate-50">
            {/* Header */}
            <header className="mobile-settings-header">
                <Link to="/m/profile" className="mobile-back-btn">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">修改密码</h1>
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
                {/* Method Selector */}
                {canUseEmail && (
                    <div className="mobile-card">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                onClick={() => setMethod('password')}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${method === 'password' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
                                    }`}
                            >
                                <Lock size={14} />
                                使用原密码
                            </button>
                            <button
                                onClick={() => setMethod('email')}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${method === 'email' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
                                    }`}
                            >
                                <Mail size={14} />
                                邮箱验证
                            </button>
                        </div>
                    </div>
                )}

                {/* Current Password or Email Code */}
                <div className="mobile-card">
                    {method === 'password' ? (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">当前密码</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm input-focus"
                                    placeholder="输入当前密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleShowPassword('current')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">邮箱验证码</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={e => setEmailCode(e.target.value)}
                                    className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm input-focus"
                                    placeholder="输入验证码"
                                    maxLength={6}
                                />
                                <button
                                    onClick={handleSendCode}
                                    disabled={codeSending}
                                    className="btn-secondary px-4 py-3 flex items-center gap-2 text-sm"
                                >
                                    {codeSending ? (
                                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    ) : (
                                        <Send size={14} />
                                    )}
                                    发送
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Password */}
                <div className="mobile-card">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">新密码</label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm input-focus"
                            placeholder="输入新密码（至少6位）"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowPassword('new')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="mobile-card">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">确认新密码</label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm input-focus"
                            placeholder="再次输入新密码"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowPassword('confirm')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <Loading variant="inline" text="提交中..." className="text-white" />
                    ) : (
                        <>
                            <Check size={18} />
                            确认修改
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
