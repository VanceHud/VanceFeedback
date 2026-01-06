import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import { ChevronLeft, FileText, User, Tag, Settings, Play } from 'lucide-react';
import Loading from '../../../components/Loading';
import { formatDate } from '../../../utils/date';

const actionLabels = {
    'user_login': '登录',
    'delete_ticket': '删除工单',
    'change_role': '修改权限',
    'update_settings': '更新设置',
    'create_question_type': '新增问题类型',
    'update_question_type': '更新问题类型',
    'delete_question_type': '删除问题类型',
    'create_user': '创建用户',
    'update_user': '更新用户',
    'review_ticket': '审核工单'
};

const actionColors = {
    'user_login': 'bg-emerald-100 text-emerald-700',
    'delete_ticket': 'bg-red-100 text-red-700',
    'change_role': 'bg-purple-100 text-purple-700',
    'update_settings': 'bg-amber-100 text-amber-700',
    'review_ticket': 'bg-violet-100 text-violet-700'
};

export default function MobileAdminAudit() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        // Simple loading for first page, background for more
        if (page === 1) setLoading(true);
        try {
            const res = await api.get('/audit', { params: { page, limit: 20 } });
            if (res.data.logs) {
                if (page === 1) {
                    setLogs(res.data.logs);
                } else {
                    setLogs(prev => [...prev, ...res.data.logs]);
                }
                setHasMore(res.data.pagination?.page < res.data.pagination?.totalPages);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mobile-page">
            <header className="mobile-admin-header flex items-center gap-2">
                <button onClick={() => navigate('/m/admin/more')} className="p-1 -ml-2">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-lg font-bold text-slate-800">审计日志</h1>
            </header>

            <div className="px-4 py-4 space-y-3">
                {loading && page === 1 ? <Loading variant="section" /> : logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <FileText size={40} className="mx-auto mb-2 opacity-50" />
                        <p>暂无日志</p>
                    </div>
                ) : (
                    <>
                        {logs.map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                            {log.username?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-800">{log.username}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                        {actionLabels[log.action] || log.action}
                                    </span>
                                </div>
                                <div className="text-slate-500 text-xs mb-1 font-mono">
                                    {log.target_type} #{log.target_id} · {log.ip_address}
                                </div>
                                <div className="text-slate-400 text-xs text-right">
                                    {formatDate(log.created_at)}
                                </div>
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="w-full py-3 text-sm text-indigo-600 font-medium text-center"
                            >
                                加载更多
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
