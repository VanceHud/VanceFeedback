import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import {
    Search, Filter, RefreshCcw, Download, XCircle, MessageSquare
} from 'lucide-react';
import Loading from '../../components/Loading';
import TicketCard from '../../components/admin/TicketCard';
import { statusConfig, typeLabels } from './constants';

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [tabError, setTabError] = useState('');
    const [replyText, setReplyText] = useState({});
    const [expandedTickets, setExpandedTickets] = useState({});
    const [editingReply, setEditingReply] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [aiSuggesting, setAiSuggesting] = useState({});
    const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [reviewFilter, setReviewFilter] = useState('');

    // Pagination
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Ticket statistics
    const [ticketStats, setTicketStats] = useState({
        total: 0, pending: 0, processing: 0, resolved: 0, reviewed: 0, unreviewed: 0
    });

    const fetchTicketStats = async () => {
        try {
            const res = await api.get('/tickets/stats');
            setTicketStats(res.data.overview || res.data);
        } catch (err) {
            console.error('Failed to fetch ticket stats:', err);
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

    const fetchData = async () => {
        setLoading(true);
        setTabError('');
        try {
            const params = {
                page: pagination.page,
                limit: 10,
                search: searchQuery,
                status: statusFilter
            };
            if (reviewFilter === 'reviewed') params.isPublic = 'true';
            if (reviewFilter === 'unreviewed') params.isPublic = 'false';

            const res = await api.get('/tickets', { params });
            if (res.data.pagination) {
                setTickets(res.data.tickets || []);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            } else if (Array.isArray(res.data)) {
                setTickets(res.data);
            } else if (res.data.tickets && Array.isArray(res.data.tickets)) {
                setTickets(res.data.tickets);
            } else {
                setTickets([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setTabError(error.response?.data?.error || '加载失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTicketStats();
        fetchSettings();
    }, [pagination.page, searchQuery, statusFilter, reviewFilter]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateStatus = async (id, status) => {
        await api.put(`/tickets/${id}`, { status });
        fetchData();
        fetchTicketStats();
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!confirm('确定删除这个工单？此操作不可恢复，所有相关回复也将被删除。')) return;
        try {
            await api.delete(`/tickets/${ticketId}`);
            fetchData();
            fetchTicketStats();
        } catch (err) {
            alert(err.response?.data?.error || '删除失败');
        }
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

    const handleReply = async (ticketId) => {
        const content = replyText[ticketId];
        if (!content || content.trim() === '') return;
        try {
            await api.post(`/tickets/${ticketId}/replies`, { content });
            setReplyText({ ...replyText, [ticketId]: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || '回复失败');
        }
    };

    const handleEditReply = async (ticketId, replyId) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/tickets/${ticketId}/replies/${replyId}`, { content: editContent });
            setEditingReply(null);
            setEditContent('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || '编辑失败');
        }
    };

    const handleDeleteReply = async (ticketId, replyId) => {
        if (!confirm('确定删除这条回复？')) return;
        try {
            await api.delete(`/tickets/${ticketId}/replies/${replyId}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || '删除失败');
        }
    };

    const startEditingReply = (reply) => {
        setEditingReply(reply.id);
        setEditContent(reply.content);
    };

    const cancelEditingReply = () => {
        setEditingReply(null);
        setEditContent('');
    };

    const toggleExpanded = (ticketId) => {
        setExpandedTickets(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }));
    };

    const handleAISuggestion = async (ticketId) => {
        setAiSuggesting(prev => ({ ...prev, [ticketId]: true }));
        try {
            const res = await api.post(`/tickets/${ticketId}/suggest-reply`);
            const suggestion = res.data.suggestion;
            setReplyText(prev => ({ ...prev, [ticketId]: suggestion }));
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'AI建议生成失败';
            alert(errorMsg);
        } finally {
            setAiSuggesting(prev => ({ ...prev, [ticketId]: false }));
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setReviewFilter('');
    };

    const exportToCSV = () => {
        if (tickets.length === 0) {
            alert('当前没有可导出的数据');
            return;
        }
        const headers = ['ID', 'Type', 'Content', 'Status', 'User', 'Contact', 'Created At', 'Rating', 'Comment'];
        const csvContent = [
            headers.join(','),
            ...tickets.map(t => {
                const typeText = typeLabels[t.type]?.text || t.type;
                const statusText = statusConfig[t.status]?.label || t.status;
                const createdAt = formatDate(t.created_at);
                const escape = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
                return [
                    t.id, escape(typeText), escape(t.content), escape(statusText),
                    escape(t.user_id), escape(t.contact), escape(createdAt),
                    t.rating || '', escape(t.rating_comment)
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">工单管理</h1>
                    <p className="text-slate-500 mt-1">管理和处理用户提交的反馈工单</p>
                </div>
            </div>

            {tabError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2">
                    <span>{tabError}</span>
                </div>
            )}

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索工单编号或内容..."
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"
                    >
                        <option value="">全部状态</option>
                        <option value="pending">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="resolved">已解决</option>
                    </select>

                    {/* Review Status Filter */}
                    <select
                        value={reviewFilter}
                        onChange={(e) => setReviewFilter(e.target.value)}
                        className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"
                    >
                        <option value="">全部审核状态</option>
                        <option value="reviewed">已公开</option>
                        <option value="unreviewed">待审核</option>
                    </select>

                    {/* Clear Filters */}
                    {(searchQuery || statusFilter || reviewFilter) && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <XCircle size={16} />
                            清除筛选
                        </button>
                    )}

                    {/* Refresh Button */}
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

                    {/* Export CSV Button */}
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-green-600 transition-all shadow-sm hover:shadow"
                        title="导出当页数据"
                    >
                        <Download size={16} />
                        导出
                    </button>
                </div>

                {/* Statistics */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
                    <span className="text-slate-600">
                        📊 共 <span className="font-semibold text-indigo-600">{pagination.total}</span> 条工单
                    </span>
                    <span className="text-amber-600">待处理: {ticketStats.pending}</span>
                    <span className="text-blue-600">处理中: {ticketStats.processing}</span>
                    <span className="text-emerald-600">已解决: {ticketStats.resolved}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-emerald-600">已公开: {ticketStats.reviewed}</span>
                    <span className="text-amber-600">待审核: {ticketStats.unreviewed}</span>
                </div>
            </div>

            {/* Tickets List */}
            {loading && tickets.length === 0 ? (
                <Loading variant="section" text="正在加载工单..." />
            ) : tickets.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-card border border-slate-100">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={40} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">暂无工单</p>
                    {(searchQuery || statusFilter || reviewFilter) && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            清除筛选条件
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket, index) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={index}
                            currentUser={currentUser}
                            expandedTickets={expandedTickets}
                            replyText={replyText}
                            editingReply={editingReply}
                            editContent={editContent}
                            aiSuggesting={aiSuggesting}
                            onToggleExpanded={toggleExpanded}
                            onUpdateStatus={handleUpdateStatus}
                            onDeleteTicket={handleDeleteTicket}
                            onReviewTicket={handleReviewTicket}
                            onReply={handleReply}
                            onReplyTextChange={(ticketId, value) => setReplyText(prev => ({ ...prev, [ticketId]: value }))}
                            onStartEditingReply={startEditingReply}
                            onCancelEditingReply={cancelEditingReply}
                            onEditReply={handleEditReply}
                            onDeleteReply={handleDeleteReply}
                            onEditContentChange={setEditContent}
                            onAISuggestion={handleAISuggestion}
                            aiEnabled={settings.ai_enabled}
                            aiReplyEnabled={settings.ai_reply_enabled}
                            aiSummaryEnabled={settings.ai_summary_enabled}
                        />
                    ))}
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
