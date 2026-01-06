import React, { memo, useState } from 'react';
import {
    Send, ChevronDown, ChevronUp, Edit, Trash2, XCircle, Save,
    Eye, EyeOff, Star, RefreshCcw, Sparkles, FileText, X
} from 'lucide-react';
import { formatDate } from '../../utils/date';
import { statusConfig, typeLabels } from '../../pages/admin/constants';
import api from '../../api';

// Memoized Ticket Card Component for better performance
const TicketCard = memo(({
    ticket,
    index,
    currentUser,
    expandedTickets,
    replyText,
    editingReply,
    editContent,
    aiSuggesting,
    onToggleExpanded,
    onUpdateStatus,
    onDeleteTicket,
    onReviewTicket,
    onReply,
    onReplyTextChange,
    onStartEditingReply,
    onCancelEditingReply,
    onEditReply,
    onDeleteReply,
    onEditContentChange,

    onAISuggestion,
    aiEnabled,
    aiReplyEnabled,
    aiSummaryEnabled
}) => {
    const status = statusConfig[ticket.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const isExpanded = expandedTickets[ticket.id];
    const replies = ticket.replies || [];
    const typeInfo = typeLabels[ticket.type] || typeLabels.other;

    // AI Summary state
    const [showSummary, setShowSummary] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryError, setSummaryError] = useState('');

    const handleAISummary = async (force = false) => {
        // If we already have summary data and not forcing refresh, just show it
        if (summaryData && !force) {
            setShowSummary(true);
            return;
        }

        setSummaryLoading(true);
        setSummaryError('');
        setShowSummary(true);
        try {
            // Add refresh parameter to bypass server cache when forcing refresh
            const url = force ? `/tickets/${ticket.id}/summary?refresh=1` : `/tickets/${ticket.id}/summary`;
            const res = await api.get(url);
            setSummaryData(res.data);
        } catch (err) {
            setSummaryError(err.response?.data?.error || err.response?.data?.message || 'AI总结生成失败');
        } finally {
            setSummaryLoading(false);
        }
    };

    const closeSummary = () => {
        setShowSummary(false);
        // Keep summaryData cached so we don't need to call API again
    };

    return (
        <div
            className={`stagger-item bg-gradient-to-br ${status.bgGradient} rounded-2xl shadow-card border border-slate-200/50 overflow-hidden card-hover relative`}
            style={{ animationDelay: `${index * 0.08}s` }}
        >
            {/* AI Summary Modal Overlay */}
            {showSummary && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-5 overflow-auto animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                                <FileText size={16} className="text-white" />
                            </div>
                            <h4 className="font-bold text-slate-800">AI 工单总结</h4>
                            {summaryData && summaryData.cached && (
                                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Sparkles size={10} />
                                    秒开缓存
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">

                            <button
                                onClick={closeSummary}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {summaryLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <RefreshCcw size={32} className="text-purple-500 animate-spin mb-3" />
                            <p className="text-slate-500">AI 正在分析工单...</p>
                        </div>
                    ) : summaryError ? (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                            {summaryError}
                        </div>
                    ) : summaryData ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <p className="text-sm font-medium text-purple-700 mb-1">📝 概述</p>
                                <p className="text-slate-700">{summaryData.summary}</p>
                            </div>

                            {/* Status */}
                            {summaryData.status && (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-sm font-medium text-slate-600">📋 问题类型：{summaryData.status}</p>
                                </div>
                            )}

                            {/* Key Points */}
                            {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">🔑 关键要点</p>
                                    <ul className="space-y-1.5">
                                        {summaryData.keyPoints.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <span className="text-indigo-500 mt-0.5">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Items */}
                            {summaryData.actionItems && summaryData.actionItems.length > 0 && summaryData.actionItems[0] !== '' && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">✅ 待办事项</p>
                                    <ul className="space-y-1.5">
                                        {summaryData.actionItems.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <span className="text-emerald-500 mt-0.5">→</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Ticket Header */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
                            <span className="text-xl">{typeInfo.emoji}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">#{ticket.id}</span>
                                <span className="text-slate-600">{typeInfo.text}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                {formatDate(ticket.created_at)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* AI Summary Button */}
                        {aiEnabled !== false && aiSummaryEnabled !== false && (
                            <button
                                onClick={handleAISummary}
                                className="p-2.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                                title="AI 工单总结"
                            >
                                <FileText size={16} />
                            </button>
                        )}
                        {/* Public/Pending Badge */}
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ticket.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {ticket.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                            {ticket.is_public ? '已公开' : '待审核'}
                        </span>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.className}`}>
                            <StatusIcon size={14} />
                            {status.label}
                        </span>
                        <select
                            value={ticket.status}
                            onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                            className="text-xs border-2 border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer font-medium"
                        >
                            <option value="pending">待处理</option>
                            <option value="processing">处理中</option>
                            <option value="resolved">已解决</option>
                        </select>
                        <button
                            onClick={() => onReviewTicket(ticket.id, !ticket.is_public)}
                            className={`p-2.5 rounded-xl transition-colors ${ticket.is_public
                                ? 'text-emerald-600 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                            title={ticket.is_public ? '设为待审核' : '设为公开'}
                        >
                            {ticket.is_public ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                            onClick={() => onDeleteTicket(ticket.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="删除工单"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Ticket Content */}
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
                    <p className="text-slate-700 leading-relaxed">{ticket.content}</p>
                    {ticket.location && (
                        <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                            📍 {ticket.location}
                        </p>
                    )}
                    {ticket.contact && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            📞 {ticket.contact}
                        </p>
                    )}

                    {/* User Rating Display */}
                    {ticket.rating && (
                        <div className="mt-4 pt-3 border-t border-slate-100 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-slate-700">用户评价:</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            className={`${star <= ticket.rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-slate-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-amber-600 ml-1">
                                    {ticket.rating}.0
                                </span>
                            </div>
                            {ticket.rating_comment && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-sm text-slate-600 italic">
                                        "{ticket.rating_comment}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Replies Section */}
            <div className="border-t border-slate-200/50">
                {/* Toggle Replies */}
                <button
                    onClick={() => onToggleExpanded(ticket.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between bg-white/60 hover:bg-white/80 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        💬 回复 ({replies.length})
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                    <div className="px-5 pb-5 bg-white/40 space-y-4">
                        {/* Existing Replies */}
                        {replies.length > 0 && (
                            <div className="space-y-3">
                                {replies.map(reply => (
                                    <div
                                        key={reply.id}
                                        className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                    {reply.admin_name?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-800">{reply.admin_name}</span>
                                                    <span className="text-xs text-slate-400 ml-2">
                                                        {formatDate(reply.created_at)}
                                                        {reply.updated_at && ' (已编辑)'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Edit/Delete buttons - for own replies or super_admin */}
                                            {(reply.admin_id === currentUser.id || currentUser.role === 'super_admin') && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => onStartEditingReply(reply)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteReply(ticket.id, reply.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reply Content or Edit Mode */}
                                        {editingReply === reply.id ? (
                                            <div className="mt-3">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => onEditContentChange(e.target.value)}
                                                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={onCancelEditingReply}
                                                        className="flex items-center gap-1 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                                    >
                                                        <XCircle size={14} />
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={() => onEditReply(ticket.id, reply.id)}
                                                        className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Save size={14} />
                                                        保存
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-slate-600 text-sm leading-relaxed pl-10">
                                                {reply.content}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Reply Input */}
                        <div className="space-y-3">
                            {/* AI Suggestion Button */}
                            <div className="flex justify-end">
                                {aiEnabled !== false && aiReplyEnabled !== false && (
                                    <button
                                        onClick={() => onAISuggestion(ticket.id)}
                                        disabled={aiSuggesting[ticket.id]}
                                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="让AI帮你生成回复建议"
                                    >
                                        {aiSuggesting[ticket.id] ? (
                                            <>
                                                <RefreshCcw size={14} className="animate-spin" />
                                                AI思考中...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                AI建议回复
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="flex gap-3">
                                <input
                                    className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 bg-white"
                                    placeholder="输入回复内容..."
                                    value={replyText[ticket.id] || ''}
                                    onChange={(e) => onReplyTextChange(ticket.id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && onReply(ticket.id)}
                                />
                                <button
                                    onClick={() => onReply(ticket.id)}
                                    className="btn-primary flex items-center gap-2 py-3 px-5"
                                >
                                    <Send size={16} />
                                    发送
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

TicketCard.displayName = 'TicketCard';

export default TicketCard;

