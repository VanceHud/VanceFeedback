import React, { useState, useEffect } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import { Mail, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';

export default function AdminEmailTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({ subject: '', content: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/email-templates');
            setTemplates(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openEdit = (t) => {
        setEditing(t);
        setFormData({ subject: t.subject, content: t.content });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/email-templates/${editing.id}`, formData);
            setMessage({ type: 'success', text: '保存成功' });
            setIsModalOpen(false);
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '保存失败' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div><h1 className="text-2xl font-bold text-slate-800">邮件模版管理</h1>
                <p className="text-slate-500 mt-1">编辑系统发送的邮件内容</p></div>

            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <span className="font-bold text-slate-700 text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-500" />邮件模版
                    </span>
                </div>

                {loading ? <Loading variant="section" text="加载中..." /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-sm">
                                <tr>
                                    <th className="p-4 font-semibold">模版</th>
                                    <th className="p-4 font-semibold">主题</th>
                                    <th className="p-4 font-semibold">变量</th>
                                    <th className="p-4 font-semibold">更新</th>
                                    <th className="p-4 font-semibold">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="p-4"><span className="font-medium">{t.name}</span><br /><span className="text-xs text-slate-400 font-mono">{t.template_key}</span></td>
                                        <td className="p-4 text-slate-600">{t.subject}</td>
                                        <td className="p-4"><div className="flex flex-wrap gap-1">{JSON.parse(t.variables).map((v, i) => (<span key={i} className="px-2 py-0.5 bg-slate-100 text-xs rounded font-mono">{v}</span>))}</div></td>
                                        <td className="p-4 text-slate-500 text-sm">{formatDate(t.updated_at)}</td>
                                        <td className="p-4"><button onClick={() => openEdit(t)} className="p-2 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && editing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">编辑: {editing.name}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm font-semibold mb-2">邮件主题</label>
                                <input required className="w-full border-2 border-slate-200 rounded-xl p-3" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} /></div>
                            <div><label className="block text-sm font-semibold mb-2">内容 (HTML) <span className="text-xs text-slate-500">变量: {JSON.parse(editing.variables).join(', ')}</span></label>
                                <textarea required className="w-full border-2 border-slate-200 rounded-xl p-3 font-mono text-sm" rows={12} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} /></div>
                            <button className="w-full btn-primary py-4 rounded-xl">保存</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
