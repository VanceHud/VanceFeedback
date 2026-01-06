import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import {
    FileText, RefreshCcw, X
} from 'lucide-react';
import Loading from '../../components/Loading';
import AuditLogRow from '../../components/admin/AuditLogRow';
import { actionLabels } from './constants';

export default function AdminAudit() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [auditActions, setAuditActions] = useState([]);
    const [auditFilter, setAuditFilter] = useState({ action: '' });
    const [selectedAuditLog, setSelectedAuditLog] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { page: pagination.page, limit: 20 };
            if (auditFilter.action) params.action = auditFilter.action;
            const res = await api.get('/audit', { params });
            setAuditLogs(res.data.logs);
            setPagination(res.data.pagination);
            // Fetch available actions for filter
            const actionsRes = await api.get('/audit/actions');
            setAuditActions(actionsRes.data);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pagination.page, auditFilter.action]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">审计日志</h1>
                    <p className="text-slate-500 mt-1">记录所有管理操作，仅超级管理员可见</p>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-bold text-slate-700 text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                审计日志
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={auditFilter.action}
                                onChange={(e) => {
                                    setAuditFilter({ action: e.target.value });
                                    setPagination(p => ({ ...p, page: 1 }));
                                }}
                                className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">全部操作</option>
                                {auditActions.map(action => (
                                    <option key={action} value={action}>
                                        {actionLabels[action] || action}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={fetchData}
                                className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2"
                            >
                                <RefreshCcw size={16} />
                                刷新
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading && auditLogs.length === 0 ? (
                        <Loading variant="section" text="正在加载审计日志..." />
                    ) : auditLogs.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">暂无审计记录</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-sm">
                                <tr>
                                    <th className="p-4 font-semibold">时间</th>
                                    <th className="p-4 font-semibold">操作者</th>
                                    <th className="p-4 font-semibold">操作类型</th>
                                    <th className="p-4 font-semibold">目标</th>
                                    <th className="p-4 font-semibold">IP地址</th>
                                    <th className="p-4 font-semibold">详情</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditLogs.map(log => (
                                    <AuditLogRow
                                        key={log.id}
                                        log={log}
                                        onSelect={setSelectedAuditLog}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* Audit Log Detail Modal */}
            {selectedAuditLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAuditLog(null)}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-slide-up" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedAuditLog(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-indigo-500" />
                                审计日志详情
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">时间</span>
                                <span className="font-medium text-slate-700">{formatDate(selectedAuditLog.created_at)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">操作者</span>
                                <span className="font-medium text-slate-700">{selectedAuditLog.username}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">操作类型</span>
                                <span className="font-medium text-slate-700">{selectedAuditLog.action}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">目标类型</span>
                                <span className="font-medium text-slate-700">{selectedAuditLog.target_type}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">目标ID</span>
                                <span className="font-medium text-slate-700">{selectedAuditLog.target_id || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-500">IP地址</span>
                                <span className="font-mono text-sm text-slate-700">{selectedAuditLog.ip_address || '-'}</span>
                            </div>
                            <div className="py-3">
                                <span className="text-slate-500 block mb-2">详细信息</span>
                                <pre className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 overflow-x-auto">
                                    {JSON.stringify(
                                        typeof selectedAuditLog.details === 'string'
                                            ? JSON.parse(selectedAuditLog.details || '{}')
                                            : selectedAuditLog.details || {},
                                        null, 2
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
