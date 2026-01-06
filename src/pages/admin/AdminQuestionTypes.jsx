import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Tag, Plus, Edit, Trash2, X, CheckCircle, AlertCircle
} from 'lucide-react';
import Loading from '../../components/Loading';

export default function AdminQuestionTypes() {
    const [questionTypes, setQuestionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        type_key: '', label: '', emoji: '📝', description: '', sort_order: 0, is_active: 1
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/question-types');
            setQuestionTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch question types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setEditingType(null);
        setFormData({ type_key: '', label: '', emoji: '📝', description: '', sort_order: 0, is_active: 1 });
        setIsModalOpen(true);
    };

    const openEditModal = (type) => {
        setEditingType(type);
        setFormData({
            type_key: type.type_key,
            label: type.label,
            emoji: type.emoji,
            description: type.description || '',
            sort_order: type.sort_order,
            is_active: type.is_active
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/question-types/${editingType.id}`, formData);
                setMessage({ type: 'success', text: '问题类型已更新' });
            } else {
                await api.post('/question-types', formData);
                setMessage({ type: 'success', text: '问题类型创建成功' });
            }
            setIsModalOpen(false);
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
        }
    };

    const handleToggleActive = async (type) => {
        try {
            await api.put(`/question-types/${type.id}`, { ...type, is_active: type.is_active ? 0 : 1 });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除这个问题类型？')) return;
        try {
            await api.delete(`/question-types/${id}`);
            setMessage({ type: 'success', text: '问题类型已删除' });
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '删除失败' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">问题类型管理</h1>
                    <p className="text-slate-500 mt-1">管理工单的问题类型分类（仅超级管理员可见）</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <span className="font-bold text-slate-700 text-lg flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-500" />
                            问题类型管理
                        </span>
                        <p className="text-sm text-slate-500 mt-1">管理工单的问题类型分类</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary flex items-center gap-2 py-2.5 px-4"
                    >
                        <Plus size={18} />
                        添加类型
                    </button>
                </div>

                {loading && questionTypes.length === 0 ? (
                    <Loading variant="section" text="正在加载问题类型..." />
                ) : (
                    <div className="overflow-x-auto">
                        {questionTypes.length === 0 ? (
                            <div className="text-center py-16">
                                <Tag size={40} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">暂无问题类型</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">图标</th>
                                        <th className="p-4 font-semibold">标识</th>
                                        <th className="p-4 font-semibold">名称</th>
                                        <th className="p-4 font-semibold">描述</th>
                                        <th className="p-4 font-semibold">排序</th>
                                        <th className="p-4 font-semibold">状态</th>
                                        <th className="p-4 font-semibold">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {questionTypes.map(type => (
                                        <tr key={type.id} className={`hover:bg-slate-50 transition-colors ${!type.is_active ? 'opacity-50' : ''}`}>
                                            <td className="p-4 text-2xl">{type.emoji}</td>
                                            <td className="p-4 font-mono text-sm text-slate-600">{type.type_key}</td>
                                            <td className="p-4 font-medium text-slate-800">{type.label}</td>
                                            <td className="p-4 text-slate-500 text-sm">{type.description || '-'}</td>
                                            <td className="p-4 text-slate-600">{type.sort_order}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleActive(type)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${type.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                >
                                                    {type.is_active ? '启用中' : '已禁用'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(type)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                {editingType ? <Edit className="w-6 h-6 text-white" /> : <Tag className="w-6 h-6 text-white" />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingType ? '编辑问题类型' : '添加问题类型'}
                            </h3>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">类型标识</label>
                                    <input
                                        required
                                        placeholder="如: facility"
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                        value={formData.type_key}
                                        onChange={e => setFormData({ ...formData, type_key: e.target.value })}
                                        disabled={editingType}
                                    />
                                    {editingType && <p className="text-xs text-slate-400 mt-1">类型标识不可修改</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">图标</label>
                                    <input
                                        required
                                        placeholder="🔧"
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl"
                                        value={formData.emoji}
                                        onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700">显示名称</label>
                                <input
                                    required
                                    placeholder="如: 设施报修"
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700">描述 (选填)</label>
                                <input
                                    placeholder="如: 座椅、灯光、空调等"
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">排序</label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={formData.sort_order}
                                        onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700">状态</label>
                                    <select
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>启用</option>
                                        <option value={0}>禁用</option>
                                    </select>
                                </div>
                            </div>
                            <button className="w-full btn-primary py-4 rounded-xl text-lg">
                                {editingType ? '保存修改' : '立即创建'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
