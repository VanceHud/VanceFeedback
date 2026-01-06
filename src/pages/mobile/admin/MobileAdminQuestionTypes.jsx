import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import { ChevronLeft, Tag, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import Loading from '../../../components/Loading';

export default function MobileAdminQuestionTypes() {
    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/question-types/all');
            setTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch types:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleType = async (item) => {
        try {
            // Optimistic update
            setTypes(prev => prev.map(t =>
                t.id === item.id ? { ...t, is_active: !t.is_active } : t
            ));

            await api.put(`/question-types/${item.id}`, {
                ...item,
                is_active: !item.is_active ? 1 : 0
            });
            // Re-fetch to ensure sync? Or mostly fine.
        } catch (err) {
            alert('操作失败');
            fetchTypes(); // Revert
        }
    };

    return (
        <div className="mobile-page">
            <header className="mobile-admin-header flex items-center gap-2">
                <button onClick={() => navigate('/m/admin/more')} className="p-1 -ml-2">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-lg font-bold text-slate-800">问题类型</h1>
            </header>

            <div className="px-4 py-4 space-y-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm mb-4">
                    💡 这里可以控制哪些问题类型对用户可见
                </div>

                {loading ? <Loading variant="section" /> : (
                    types.map(item => (
                        <div key={item.id} className="mobile-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{item.emoji}</div>
                                <div>
                                    <div className="font-medium text-slate-800">{item.label}</div>
                                    <div className="text-xs text-slate-500">{item.description || '无描述'}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleType(item)}
                                className={`transition-colors ${item.is_active ? 'text-indigo-600' : 'text-slate-300'}`}
                            >
                                {item.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
