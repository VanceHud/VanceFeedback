import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import {
    Eye, EyeOff, CheckSquare, Square, RefreshCcw
} from 'lucide-react';
import Loading from '../../components/Loading';
import { statusConfig, typeLabels } from './constants';

export default function AdminTicketReview() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [reviewTabFilter, setReviewTabFilter] = useState('unreviewed');
    const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    // Pagination
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Ticket statistics
    const [ticketStats, setTicketStats] = useState({ reviewed: 0, unreviewed: 0 });

    const fetchTicketStats = async () => {
        try {
            const res = await api.get('/tickets/stats');
            setTicketStats(res.data.overview || res.data);
        } catch (err) {
            console.error('Failed to fetch ticket stats:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 10
            };
            if (reviewTabFilter === 'reviewed') params.isPublic = 'true';
            if (reviewTabFilter === 'unreviewed') params.isPublic = 'false';

            const res = await api.get('/tickets', { params });
            if (res.data.pagination) {
                setTickets(res.data.tickets);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            } else {
                setTickets(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTicketStats();
    }, [pagination.page, reviewTabFilter]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReviewTicket = async (ticketId, isPublic) => {
        try {
            await api.put(`/tickets/${ticketId}/review`, { is_public: isPublic });
            fetchData();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '审核操作失败');
        }
    };

    const handleBatchReview = async (isPublic) => {
        if (selectedTickets.size === 0) {
            alert('请先选择要审核的工单');
            return;
        }
        const ticketIds = Array.from(selectedTickets);
        if (!confirm(`确定要将 ${ticketIds.length} 个工单${isPublic ? '设为公开' : '设为待审核'}？`)) return;
        try {
            await api.put('/tickets/batch-review', { ticketIds, is_public: isPublic });
            setSelectedTickets(new Set());
            fetchData();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '批量审核失败');
        }
    };

    const toggleSelectTicket = (ticketId) => {
        setSelectedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedTickets.size === tickets.length && tickets.length > 0) {
            setSelectedTickets(new Set());
        } else {
            setSelectedTickets(new Set(tickets.map(t => t.id)));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">工单审核</h1>
                    <p className="text-slate-500 mt-1">审核工单是否公开显示</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-800">工单审核</h3>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Review Filter */}
                        <select
                            value={reviewTabFilter}
                            onChange={(e) => { setReviewTabFilter(e.target.value); setSelectedTickets(new Set()); }}
                            className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">全部工单</option>
                            <option value="unreviewed">待审核</option>
                            <option value="reviewed">已公开</option>
                        </select>

                        {/* Refresh */}
                        <button
                            onClick={() => { fetchData(); fetchTicketStats(); }}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'shadow-sm hover:shadow'}`}
                        >
                            {loading ? (
                                <Loading variant="inline" text="刷新中..." />
                            ) : (
                                <>
                                    <RefreshCcw size={16} />
                                    刷新
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Batch Actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-center">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {selectedTickets.size === tickets.length && tickets.length > 0 ? (
                            <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                            <Square size={18} />
                        )}
                        全选
                    </button>

                    {selectedTickets.size > 0 && (
                        <>
                            <span className="text-sm text-slate-500">
                                已选择 <span className="font-semibold text-indigo-600">{selectedTickets.size}</span> 项
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBatchReview(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors"
                                >
                                    <Eye size={16} />
                                    批量公开
                                </button>
                                <button
                                    onClick={() => handleBatchReview(false)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
                                >
                                    <EyeOff size={16} />
                                    批量取消公开
                                </button>
                            </div>
                        </>
                    )}

                    <div className="flex-1" />

                    {/* Stats */}
                    <span className="text-sm text-emerald-600">已公开: {ticketStats.reviewed}</span>
                    <span className="text-sm text-amber-600">待审核: {ticketStats.unreviewed}</span>
                </div>
            </div>

            {/* Ticket List */}
            {loading && tickets.length === 0 ? (
                <Loading variant="section" text="正在加载工单..." />
            ) : tickets.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-card border border-slate-100">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Eye size={40} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">暂无工单</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map((ticket) => {
                        const status = statusConfig[ticket.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        const typeInfo = typeLabels[ticket.type] || typeLabels.other;

                        return (
                            <div
                                key={ticket.id}
                                className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${selectedTickets.has(ticket.id) ? 'ring-2 ring-indigo-500 border-indigo-200' : 'border-slate-200'}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelectTicket(ticket.id)}
                                        className="flex-shrink-0 p-1 mt-1"
                                    >
                                        {selectedTickets.has(ticket.id) ? (
                                            <CheckSquare size={22} className="text-indigo-600" />
                                        ) : (
                                            <Square size={22} className="text-slate-300 hover:text-slate-400" />
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xl">{typeInfo.emoji}</span>
                                            <span className="font-bold text-slate-800">#{ticket.id}</span>
                                            <span className="text-slate-600 text-sm">{typeInfo.text}</span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ticket.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {ticket.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {ticket.is_public ? '已公开' : '待审核'}
                                            </span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(ticket.created_at)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-slate-600 text-sm line-clamp-2">{ticket.content}</p>
                                        {ticket.location && (
                                            <p className="mt-1 text-xs text-slate-400">📍 {ticket.location}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <button
                                            onClick={() => handleReviewTicket(ticket.id, !ticket.is_public)}
                                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${ticket.is_public
                                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                        >
                                            {ticket.is_public ? (
                                                <>
                                                    <EyeOff size={16} />
                                                    取消公开
                                                </>
                                            ) : (
                                                <>
                                                    <Eye size={16} />
                                                    设为公开
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-slate-100">
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            上一页
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-slate-600 flex items-center">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
