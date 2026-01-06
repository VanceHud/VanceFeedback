import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../api';
import {
    ChevronDown, ChevronUp, Send, Trash2, Eye, EyeOff,
    CheckCircle, Clock, AlertCircle, Search, Edit, X,
    MessageSquare, Sparkles, RefreshCcw, FileText
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

export default function MobileAdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeLabels, setTypeLabels] = useState({});
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [ticketStats, setTicketStats] = useState({});
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // AI Summary State
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [currentTicketId, setCurrentTicketId] = useState(null);
    const [settings, setSettings] = useState({});

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
        fetchSettings();
    }, [statusFilter, debouncedSearchQuery]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = { limit: 50 };
            if (statusFilter) params.status = statusFilter;
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

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const handleUpdateStatus = async (ticketId, status) => {
        try {
            await api.put(`/tickets/${ticketId}`, { status });
            fetchTickets();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '更新失败');
        }
    };

    const handleReply = async (ticketId) => {
        if (!replyText.trim()) return;

        try {
            await api.post(`/tickets/${ticketId}/replies`, { content: replyText });
            setReplyText('');
            fetchTickets();
        } catch (err) {
            alert(err.response?.data?.error || '回复失败');
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!confirm('确定删除此工单？')) return;

        try {
            await api.delete(`/tickets/${ticketId}`);
            setExpandedTicket(null);
            fetchTickets();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '删除失败');
        }
    };

    const handleAISuggestion = async (ticketId) => {
        setAiSuggesting(true);
        try {
            const res = await api.post(`/tickets/${ticketId}/suggest-reply`);
            setReplyText(res.data.suggestion);
        } catch (err) {
            alert(err.response?.data?.error || 'AI建议生成失败');
        } finally {
            setAiSuggesting(false);
        }
    };

    const handleAISummary = async (ticketId, force = false) => {
        setCurrentTicketId(ticketId);
        setSummaryModalOpen(true);

        // If we already have data for this ticket and not forcing refresh
        if (summaryData && summaryData.ticketId === ticketId && !force) {
            return;
        }

        setSummaryLoading(true);
        setSummaryData(null);

        try {
            const url = force ? `/tickets/${ticketId}/summary?refresh=1` : `/tickets/${ticketId}/summary`;
            const res = await api.get(url);
            setSummaryData({ ...res.data, ticketId });
        } catch (err) {
            alert(err.response?.data?.error || 'AI总结生成失败');
            setSummaryModalOpen(false);
        } finally {
            setSummaryLoading(false);
        }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.pending;

    return (
        <div className="mobile-page">
            {/* Header */}
            <header className="mobile-admin-header">
                <h1 className="text-lg font-bold text-slate-800">工单管理</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        共 {ticketStats.total || 0} 条
                    </span>
                </div>
            </header>

            {/* AI Summary Modal */}
            {summaryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={() => setSummaryModalOpen(false)} />
                    <div className="bg-white w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl shadow-2xl pointer-events-auto transform transition-all animate-slide-up sm:animate-fade-in mx-auto sm:m-4 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                                    <FileText size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">AI 工单总结</h3>
                                    {summaryData?.cached && (
                                        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                                            <Sparkles size={10} />
                                            秒开缓存
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">

                                <button
                                    onClick={() => setSummaryModalOpen(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 min-h-0">
                            {summaryLoading ? (
                                <div className="py-10 text-center">
                                    <RefreshCcw size={32} className="mx-auto text-indigo-500 animate-spin mb-3" />
                                    <p className="text-slate-500">AI 正在分析工单内容...</p>
                                </div>
                            ) : summaryData ? (
                                <div className="space-y-5">
                                    {/* Summary */}
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <h4 className="flex items-center gap-2 font-semibold text-purple-800 mb-2">
                                            <Sparkles size={16} />
                                            智能概述
                                        </h4>
                                        <p className="text-sm text-purple-900/80 leading-relaxed">
                                            {summaryData.summary}
                                        </p>
                                    </div>

                                    {/* Status Info */}
                                    {summaryData.status && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                            <span className="font-medium text-slate-700">问题类型：</span>
                                            {summaryData.status}
                                        </div>
                                    )}

                                    {/* Key Points */}
                                    {summaryData.keyPoints?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <AlertCircle size={16} className="text-indigo-500" />
                                                关键要点
                                            </h4>
                                            <ul className="space-y-2">
                                                {summaryData.keyPoints.map((point, index) => (
                                                    <li key={index} className="flex gap-2 text-sm text-slate-600">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                        <span className="leading-relaxed">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Items */}
                                    {summaryData.actionItems?.length > 0 && summaryData.actionItems[0] && (
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <CheckCircle size={16} className="text-emerald-500" />
                                                建议行动
                                            </h4>
                                            <div className="space-y-2">
                                                {summaryData.actionItems.map((item, index) => (
                                                    <div key={index} className="flex gap-2.5 text-sm text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                                                        <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索内容、联系方式..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        className={`mobile-filter-chip ${statusFilter === '' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('')}
                    >
                        全部
                    </button>
                    <button
                        className={`mobile-filter-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        待处理 {ticketStats.pending || 0}
                    </button>
                    <button
                        className={`mobile-filter-chip ${statusFilter === 'processing' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('processing')}
                    >
                        处理中 {ticketStats.processing || 0}
                    </button>
                    <button
                        className={`mobile-filter-chip ${statusFilter === 'resolved' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('resolved')}
                    >
                        已解决 {ticketStats.resolved || 0}
                    </button>
                </div>
            </div>

            {/* Ticket List */}
            <div className="px-4 py-4 space-y-3">
                {loading ? (
                    <Loading variant="section" text="加载中..." />
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                        <p>暂无工单</p>
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
                                            {settings.ai_enabled !== false && settings.ai_summary_enabled !== false && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAISummary(ticket.id);
                                                    }}
                                                    className="ml-1 p-1 text-purple-600 bg-purple-50 rounded active:scale-95 transition-transform"
                                                    title="AI总结"
                                                >
                                                    <FileText size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Public status */}
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ticket.is_public
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {ticket.is_public ? <Eye size={10} /> : <EyeOff size={10} />}
                                                {ticket.is_public ? '已公开' : '待审核'}
                                            </span>
                                            {/* Status */}
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                                <StatusIcon size={10} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700 line-clamp-2 mb-2">{ticket.content}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>{formatDateOnly(ticket.created_at)}</span>
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

                                {/* Expanded Details */}
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

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {/* Status Change */}
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="pending">待处理</option>
                                                <option value="processing">处理中</option>
                                                <option value="resolved">已解决</option>
                                            </select>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTicket(ticket.id);
                                                }}
                                                className="mobile-admin-action-btn text-red-600 bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                                删除
                                            </button>
                                        </div>

                                        {/* Replies */}
                                        {replies.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-semibold text-slate-500 mb-2">回复 ({replies.length})</h4>
                                                <div className="space-y-2">
                                                    {replies.map(reply => (
                                                        <ReplyItem
                                                            key={reply.id}
                                                            reply={reply}
                                                            ticketId={ticket.id}
                                                            onUpdate={() => fetchTickets()}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reply Input */}
                                        <div className="space-y-2">
                                            <div className="flex justify-end">
                                                {settings.ai_enabled !== false && settings.ai_reply_enabled !== false && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAISuggestion(ticket.id);
                                                        }}
                                                        disabled={aiSuggesting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        {aiSuggesting ? (
                                                            <>
                                                                <RefreshCcw size={12} className="animate-spin" />
                                                                AI思考中...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles size={12} />
                                                                AI建议
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="输入回复内容..."
                                                    className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReply(ticket.id);
                                                    }}
                                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium text-sm flex items-center gap-1.5"
                                                >
                                                    <Send size={14} />
                                                    发送
                                                </button>
                                            </div>
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

// Sub-component for individual reply item to handle edit state
function ReplyItem({ reply, ticketId, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(reply.content);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!editContent.trim()) return;
        setSaving(true);
        try {
            await api.put(`/tickets/${ticketId}/replies/${reply.id}`, { content: editContent });
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || '更新失败');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定删除此回复？此操作不可撤销。')) return;
        try {
            await api.delete(`/tickets/${ticketId}/replies/${reply.id}`);
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || '删除失败');
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm animate-fade-in">
                <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 mb-2 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    placeholder="编辑回复..."
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 rounded-lg"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs text-white bg-indigo-500 rounded-lg flex items-center gap-1"
                    >
                        {saving ? <Loading variant="inline" size={12} /> : null}
                        保存
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border-l-3 border-indigo-400 group relative">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {reply.admin_name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs font-medium text-indigo-700">{reply.admin_name}</span>
                    <span className="text-xs text-slate-400">{formatDateOnly(reply.created_at)}</span>
                </div>
                {/* Edit/Delete Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1 text-slate-400 hover:text-indigo-600 bg-white/50 rounded"
                    >
                        <Edit size={12} />
                    </button>
                    {/* Wait, Trash2 is delete. Use Edit for edit. */}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="text-xs text-indigo-400 hover:text-indigo-600"
                    >
                        编辑
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="text-xs text-red-400 hover:text-red-600"
                    >
                        删除
                    </button>
                </div>
            </div>
            <p className="text-sm text-slate-600 pl-7 whitespace-pre-wrap">{reply.content}</p>
        </div>
    );
}

