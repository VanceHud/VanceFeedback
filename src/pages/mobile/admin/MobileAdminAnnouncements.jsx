import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import { ChevronLeft, Plus, Megaphone, Edit3, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import Loading from '../../../components/Loading';
import { formatDate } from '../../../utils/date';

export default function MobileAdminAnnouncements() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', priority: 0, is_active: 1 });
    const [selectedId, setSelectedId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');

        try {
            if (isEditing) {
                await api.put(`/announcements/${selectedId}`, formData);
            } else {
                await api.post('/announcements', formData);
            }
            setShowModal(false);
            fetchAnnouncements();
        } catch (err) {
            setError(err.response?.data?.error || '操作失败');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除此公告？')) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (err) {
            alert('删除失败');
        }
    };

    const openCreate = () => {
        setIsEditing(false);
        setFormData({ title: '', content: '', priority: 0, is_active: 1 });
        setError('');
        setShowModal(true);
    };

    const openEdit = (item) => {
        setIsEditing(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            content: item.content,
            priority: item.priority || 0,
            is_active: item.is_active ? 1 : 0
        });
        setError('');
        setShowModal(true);
    };

    return (
        <div className="mobile-page">
            <header className="mobile-admin-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/m/admin/more')} className="p-1 -ml-2">
                        <ChevronLeft size={24} className="text-slate-600" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">公告管理</h1>
                </div>
                <button
                    onClick={openCreate}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
                >
                    <Plus size={20} />
                </button>
            </header>

            <div className="px-4 py-4 space-y-3">
                {loading ? <Loading variant="section" /> : announcements.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Megaphone size={40} className="mx-auto mb-2 opacity-50" />
                        <p>暂无公告</p>
                    </div>
                ) : (
                    announcements.map(item => (
                        <div key={item.id} className="mobile-admin-card relative">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {item.is_active ? '已发布' : '草稿'}
                                    </span>
                                    {item.priority > 0 && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                            置顶
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.content}</p>
                            <div className="text-xs text-slate-400">
                                发布于 {formatDate(item.created_at)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="mobile-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="mobile-modal" onClick={e => e.stopPropagation()}>
                        <div className="mobile-modal-header">
                            <h2 className="text-lg font-bold text-slate-800">
                                {isEditing ? '编辑公告' : '新建公告'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="mobile-modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mobile-modal-content">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="mobile-input"
                                        placeholder="公告标题"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
                                    <textarea
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="mobile-input min-h-[120px]"
                                        placeholder="公告内容..."
                                        required
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                                        <select
                                            value={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                                            className="mobile-input"
                                        >
                                            <option value={1}>发布</option>
                                            <option value={0}>草稿</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                                        <input
                                            type="number"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                            className="mobile-input"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {formLoading ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Edit3 size={18} /> : <Plus size={18} />)}
                                    {isEditing ? '保存修改' : '立即发布'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
