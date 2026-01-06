import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import {
    Mail, Plus, Trash2, CheckCircle, AlertCircle, Crown, Shield
} from 'lucide-react';
import Loading from '../../components/Loading';
import { formatDate } from '../../utils/date';

export default function AdminNotifications() {
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [allAdminNotifications, setAllAdminNotifications] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-notifications');
            setAdminNotifications(res.data);

            if (currentUser.role === 'super_admin') {
                const allRes = await api.get('/admin-notifications/all');
                setAllAdminNotifications(allRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch admin notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddEmail = async () => {
        if (!newEmail || !newEmail.trim()) {
            setEmailMessage({ type: 'error', text: '邮箱地址不能为空' });
            return;
        }

        try {
            await api.post('/admin-notifications', { email: newEmail.trim() });
            setNewEmail('');
            setEmailMessage({ type: 'success', text: '通知邮箱添加成功' });
            fetchData();
            setTimeout(() => setEmailMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setEmailMessage({ type: 'error', text: err.response?.data?.error || '添加失败' });
        }
    };

    const handleDeleteEmail = async (id) => {
        if (!confirm('确定删除这个通知邮箱？')) return;

        try {
            await api.delete(`/admin-notifications/${id}`);
            setEmailMessage({ type: 'success', text: '通知邮箱删除成功' });
            fetchData();
            setTimeout(() => setEmailMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setEmailMessage({ type: 'error', text: err.response?.data?.error || '删除失败' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">邮件通知</h1>
                    <p className="text-slate-500 mt-1">
                        {currentUser.role === 'super_admin'
                            ? '管理所有管理员的通知邮箱'
                            : '设置接收新反馈通知的邮箱 (最多1个)'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <span className="font-bold text-slate-700 text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-500" />
                        邮件通知设置
                    </span>
                </div>

                {emailMessage.text && (
                    <div className={`mx-5 mt-5 p-4 rounded-xl flex items-center gap-2 ${emailMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {emailMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {emailMessage.text}
                    </div>
                )}

                <div className="p-5 space-y-6">
                    {/* My Notification Emails */}
                    <div className="p-5 bg-slate-50 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-800">我的通知邮箱</h3>
                                <p className="text-sm text-slate-500">
                                    {currentUser.role === 'admin' && `限制: 最多1个邮箱`}
                                </p>
                            </div>
                        </div>

                        {/* Add Email Input */}
                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="输入邮箱地址..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                            />
                            <button
                                onClick={handleAddEmail}
                                disabled={(currentUser.role === 'admin' && adminNotifications.length >= 1)}
                                className="btn-primary flex items-center gap-2 py-3 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={16} />
                                添加
                            </button>
                        </div>

                        {/* My Email List */}
                        <div className="space-y-2">
                            {loading && adminNotifications.length === 0 ? (
                                <Loading variant="section" text="正在加载通知邮箱..." />
                            ) : adminNotifications.length > 0 ? (
                                adminNotifications.map((notification) => (
                                    <div key={notification.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                            <span className="text-slate-700">{notification.email}</span>
                                            <span className="text-xs text-slate-400">
                                                ({new Date(notification.created_at).toLocaleDateString('zh-CN')})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteEmail(notification.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Mail size={40} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">暂无通知邮箱</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Notification Emails (Super Admin Only) */}
                    {currentUser.role === 'super_admin' && (
                        <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl space-y-4 border border-purple-200">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-purple-900">所有管理员的通知邮箱</h3>
                            </div>
                            <p className="text-sm text-purple-700">
                                超级管理员可查看所有管理员设置的通知邮箱
                            </p>

                            <div className="space-y-2">
                                {loading && allAdminNotifications.length === 0 ? (
                                    <Loading variant="section" text="正在加载所有管理员通知邮箱..." />
                                ) : allAdminNotifications.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="text-left border-b border-purple-200">
                                                <tr>
                                                    <th className="pb-2 text-sm font-semibold text-purple-900">邮箱地址</th>
                                                    <th className="pb-2 text-sm font-semibold text-purple-900">设置者</th>
                                                    <th className="pb-2 text-sm font-semibold text-purple-900">角色</th>
                                                    <th className="pb-2 text-sm font-semibold text-purple-900">添加时间</th>
                                                    <th className="pb-2 text-sm font-semibold text-purple-900">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-purple-100">
                                                {allAdminNotifications.map((notification) => (
                                                    <tr key={notification.id} className="hover:bg-purple-100/50 transition-colors">
                                                        <td className="py-3 text-sm text-slate-700">{notification.email}</td>
                                                        <td className="py-3 text-sm text-slate-700">{notification.admin_username}</td>
                                                        <td className="py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${notification.admin_role === 'super_admin'
                                                                ? 'bg-purple-200 text-purple-800'
                                                                : 'bg-amber-200 text-amber-800'
                                                                }`}>
                                                                {notification.admin_role === 'super_admin' ? <Crown size={10} /> : <Shield size={10} />}
                                                                {notification.admin_role === 'super_admin' ? '超级管理员' : '管理员'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-sm text-slate-500">
                                                            {formatDate(notification.created_at)}
                                                        </td>
                                                        <td className="py-3">
                                                            <button
                                                                onClick={() => handleDeleteEmail(notification.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="删除"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-purple-400">
                                        <Mail size={40} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">暂无管理员设置通知邮箱</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
