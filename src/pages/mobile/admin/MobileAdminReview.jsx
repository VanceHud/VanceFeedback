import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../api';
import {
    ChevronDown, ChevronUp, Eye, EyeOff,
    CheckCircle, Clock, AlertCircle, Search
} from 'lucide-react';
import Loading from '../../../components/Loading';
import { formatDate, formatDateOnly } from '../../../utils/date';

// Status configuration
const statusConfig = {
    pending: {
        label: '待处理',
        className: 'badge-pending',
        icon: AlertCircle,
    },
    processing: {
        label: '处理中',
        className: 'badge-processing',
        icon: Clock,
    },
    resolved: {
        label: '已解决',
        className: 'badge-resolved',
        icon: CheckCircle,
    }
};

export default function MobileAdminReview() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeLabels, setTypeLabels] = useState({});
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [reviewFilter, setReviewFilter] = useState('unreviewed');
    const [ticketStats, setTicketStats] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        // Load question types
        api.get('/question-types').then(res => {
            const labels = {};
            res.data.forEach(t => {
                labels[t.type_key] = { text: t.label, emoji: t.emoji };
            });
            setTypeLabels(labels);
        }).catch(console.error);

        fetchTickets();
        fetchTicketStats();
    }, [reviewFilter, debouncedSearchQuery]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = { limit: 50 };

            // Only fetch based on review status
            if (reviewFilter === 'reviewed') params.isPublic = 'true';
            if (reviewFilter === 'unreviewed') params.isPublic = 'false';
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;

            const res = await api.get('/tickets', { params });
            if (res.data.pagination) {
                setTickets(res.data.tickets);
            } else {
                setTickets(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketStats = async () => {
        try {
            const res = await api.get('/tickets/stats');
            setTicketStats(res.data.overview || {});
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleReviewTicket = async (ticketId, isPublic) => {
        try {
            await api.put(`/tickets/${ticketId}/review`, { is_public: isPublic });
            fetchTickets();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '审核失败');
        }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.pending;

    // Count of unreviewed tickets
    const unreviewedCount = ticketStats.unreviewed || 0;
    const reviewedCount = ticketStats.reviewed || 0;

    return (
        <div className="mobile-page">
            {/* Header */}
            <header className="mobile-admin-header">
                <h1 className="text-lg font-bold text-slate-800">工单审核</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        待审核 {unreviewedCount} 条
                    </span>
                </div>
            </header>

            {/* Description */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <p className="text-xs text-indigo-600">
                    💡 审核工单决定是否公开显示在首页的反馈列表中
                </p>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索内容..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        className={`mobile-filter-chip ${reviewFilter === 'unreviewed' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('unreviewed')}
                    >
                        <EyeOff size={12} className="inline mr-1" />
                        待审核 {unreviewedCount}
                    </button>
                    <button
                        className={`mobile-filter-chip ${reviewFilter === 'reviewed' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('reviewed')}
                    >
                        <Eye size={12} className="inline mr-1" />
                        已公开 {reviewedCount}
                    </button>
                    <button
                        className={`mobile-filter-chip ${reviewFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('all')}
                    >
                        全部
                    </button>
                </div>
            </div>

            {/* Ticket List */}
            <div className="px-4 py-4 space-y-3">
                {loading ? (
                    <Loading variant="section" text="加载中..." />
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Eye size={40} className="mx-auto mb-2 opacity-50" />
                        <p>暂无{reviewFilter === 'unreviewed' ? '待审核' : reviewFilter === 'reviewed' ? '已公开' : ''}工单</p>
                    </div>
                ) : (
                    tickets.map(ticket => {
                        const status = getStatusConfig(ticket.status);
                        const StatusIcon = status.icon;
                        const typeInfo = typeLabels[ticket.type] || { text: ticket.type, emoji: '📝' };
                        const isExpanded = expandedTicket === ticket.id;
                        const replies = ticket.replies || [];

                        return (
                            <div
                                key={ticket.id}
                                className="mobile-admin-card"
                            >
                                {/* Card Header */}
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">#{ticket.id}</span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                                                {typeInfo.emoji} {typeInfo.text}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Public status - Prominent */}
                                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ticket.is_public
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                }`}>
                                                {ticket.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {ticket.is_public ? '已公开' : '待审核'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700 line-clamp-2 mb-2">{ticket.content}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <span>{formatDateOnly(ticket.created_at)}</span>
                                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${status.className}`}>
                                                <StatusIcon size={10} />
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {replies.length > 0 && (
                                                <span className="flex items-center gap-1 text-indigo-500">
                                                    💬 {replies.length}
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details - Only show content and review action */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                                        {/* Full Content */}
                                        <div className="bg-slate-50 rounded-xl p-3 mb-4">
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.content}</p>
                                            {ticket.location && (
                                                <p className="text-xs text-slate-500 mt-2">📍 {ticket.location}</p>
                                            )}
                                            {ticket.contact && (
                                                <p className="text-xs text-slate-500 mt-1">📞 {ticket.contact}</p>
                                            )}
                                        </div>

                                        {/* Replies Preview (read-only) */}
                                        {replies.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-semibold text-slate-500 mb-2">回复 ({replies.length})</h4>
                                                <div className="space-y-2">
                                                    {replies.slice(0, 2).map(reply => (
                                                        <div
                                                            key={reply.id}
                                                            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border-l-3 border-indigo-400"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                    {reply.admin_name?.charAt(0) || 'A'}
                                                                </div>
                                                                <span className="text-xs font-medium text-indigo-700">{reply.admin_name}</span>
                                                                <span className="text-xs text-slate-400">{formatDateOnly(reply.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 pl-7">{reply.content}</p>
                                                        </div>
                                                    ))}
                                                    {replies.length > 2 && (
                                                        <p className="text-xs text-slate-400 text-center">还有 {replies.length - 2} 条回复</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Review Action - Only action available */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReviewTicket(ticket.id, !ticket.is_public);
                                                }}
                                                className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${ticket.is_public
                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-200'
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
                                                        审核通过并公开
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
