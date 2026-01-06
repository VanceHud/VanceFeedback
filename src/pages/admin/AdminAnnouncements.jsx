import React, { useState, useEffect } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import { Bell, Plus, Edit, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({ title: '', content: '', priority: 0, is_active: 1 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditing(null);
        setFormData({ title: '', content: '', priority: 0, is_active: 1 });
        setIsModalOpen(true);
    };

    const openEdit = (a) => {
        setEditing(a);
        setFormData({ title: a.title, content: a.content, priority: a.priority, is_active: a.is_active });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/announcements/${editing.id}`, formData);
            } else {
                await api.post('/announcements', formData);
            }
            setMessage({ type: 'success', text: editing ? '公告已更新' : '公告创建成功' });
            setIsModalOpen(false);
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
        }
    };

    const handleToggle = async (a) => {
        try {
            await api.put(`/announcements/${a.id}`, { ...a, is_active: a.is_active ? 0 : 1 });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除这个公告？')) return;
        try {
            await api.delete(`/announcements/${id}`);
            setMessage({ type: 'success', text: '公告已删除' });
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '删除失败' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-800">公告管理</h1>
                    <p className="text-slate-500 mt-1">管理系统公告</p></div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2.5 px-4">
                    <Plus size={18} />新建公告
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {loading ? <Loading variant="section" text="加载中..." /> : announcements.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-card border border-slate-100">
                    <Bell size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">暂无公告</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map(a => (
                        <div key={a.id} className={`bg-white rounded-xl shadow-sm border p-5 ${a.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-lg text-slate-800">{a.title}</h4>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {a.is_active ? '已启用' : '已停用'}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{a.content}</p>
                                    <div className="flex gap-4 mt-3 text-xs text-slate-400">
                                        <span>优先级: {a.priority}</span>
                                        <span>{formatDate(a.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleToggle(a)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${a.is_active ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>
                                        {a.is_active ? '停用' : '启用'}
                                    </button>
                                    <button onClick={() => openEdit(a)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1 justify-center">
                                        <Edit size={14} />编辑
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-1 justify-center">
                                        <Trash2 size={14} />删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Bell className="w-6 h-6 text-indigo-500" />{editing ? '编辑公告' : '新建公告'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm font-semibold mb-2">标题 *</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border-2 border-slate-200 rounded-xl p-3" placeholder="公告标题" /></div>
                            <div><label className="block text-sm font-semibold mb-2">内容 *</label>
                                <textarea required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full border-2 border-slate-200 rounded-xl p-3 resize-none" rows={5} placeholder="公告内容" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold mb-2">优先级</label>
                                    <input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} className="w-full border-2 border-slate-200 rounded-xl p-3" /></div>
                                <div><label className="block text-sm font-semibold mb-2">状态</label>
                                    <select value={formData.is_active} onChange={e => setFormData({ ...formData, is_active: parseInt(e.target.value) })} className="w-full border-2 border-slate-200 rounded-xl p-3">
                                        <option value={1}>启用</option><option value={0}>停用</option>
                                    </select></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">取消</button>
                                <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl">{editing ? '保存修改' : '创建公告'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
