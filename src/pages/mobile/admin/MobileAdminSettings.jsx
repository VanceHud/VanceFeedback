import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import { ChevronLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import Loading from '../../../components/Loading';

export default function MobileAdminSettings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setMessage('加载设置失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        // Process lists (convert string back to array if needed, but here we bind directly)
        // Actually, for simplicity, let's assume we handle array inputs as special fields or just ignore complex ones for now?
        // Let's support basic fields first.

        try {
            await api.put('/settings', settings);
            setMessage('设置已保存');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.error || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Helper for array fields (comma separated)
    const handleArrayChange = (key, value) => {
        const array = value.split(/[,\n]+/).map(item => item.trim()).filter(Boolean);
        handleChange(key, array);
    };

    const getArrayString = (key) => {
        return Array.isArray(settings[key]) ? settings[key].join('\n') : '';
    };

    if (loading) return <Loading variant="section" />;

    return (
        <div className="mobile-page">
            <header className="mobile-admin-header flex items-center gap-2">
                <button onClick={() => navigate('/m/admin/more')} className="p-1 -ml-2">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-lg font-bold text-slate-800">系统设置</h1>
            </header>

            <form onSubmit={handleSave} className="px-4 py-4 space-y-5">
                {message && (
                    <div className={`p-3 rounded-xl text-sm ${message.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {message}
                    </div>
                )}

                {/* Email Settings */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">SMTP 设置</h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SMTP 服务器</label>
                        <input
                            type="text"
                            value={settings.smtp_host || ''}
                            onChange={e => handleChange('smtp_host', e.target.value)}
                            className="mobile-input"
                            placeholder="smtp.example.com"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">端口</label>
                            <input
                                type="number"
                                value={settings.smtp_port || ''}
                                onChange={e => handleChange('smtp_port', parseInt(e.target.value) || 0)}
                                className="mobile-input"
                                placeholder="465"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">发送者名称</label>
                            <input
                                type="text"
                                value={settings.email_from_name || ''}
                                onChange={e => handleChange('email_from_name', e.target.value)}
                                className="mobile-input"
                                placeholder="反馈系统"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SMTP 用户名</label>
                        <input
                            type="text"
                            value={settings.smtp_user || ''}
                            onChange={e => handleChange('smtp_user', e.target.value)}
                            className="mobile-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SMTP 密码</label>
                        <input
                            type="password"
                            value={settings.smtp_pass || ''}
                            onChange={e => handleChange('smtp_pass', e.target.value)}
                            className="mobile-input"
                        />
                    </div>
                </section>

                {/* Notification Settings */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">通知设置</h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            通知邮箱列表 (一行一个)
                        </label>
                        <textarea
                            value={getArrayString('notification_emails')}
                            onChange={e => handleArrayChange('notification_emails', e.target.value)}
                            className="mobile-input min-h-[100px]"
                            placeholder="admin@example.com"
                        />
                    </div>
                </section>

                <div className="pt-4 pb-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        保存设置
                    </button>
                </div>
            </form>
        </div>
    );
}
