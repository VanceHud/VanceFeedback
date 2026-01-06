import React, { useEffect, useState } from 'react';
import api from '../../../api';
import {
    BarChart3, MessageSquare, CheckCircle, Clock,
    AlertCircle, Eye, EyeOff, TrendingUp, Star, Calendar,
    Sparkles, Lightbulb
} from 'lucide-react';
import Loading from '../../../components/Loading';

// 工单类型标签
const typeLabels = {
    'facility': { text: '设施报修', emoji: '🔧', color: 'from-blue-400 to-blue-600' },
    'books': { text: '图书借阅', emoji: '📚', color: 'from-emerald-400 to-emerald-600' },
    'system': { text: '数字资源', emoji: '💻', color: 'from-purple-400 to-purple-600' },
    'environment': { text: '环境卫生', emoji: '🌿', color: 'from-teal-400 to-teal-600' },
    'other': { text: '其他', emoji: '📝', color: 'from-slate-400 to-slate-600' }
};

export default function MobileAdminData() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all'); // all, 7days, 30days
    const [activeTab, setActiveTab] = useState('stats'); // stats, ai
    const [settings, setSettings] = useState({});

    // AI Trends State
    const [aiTrends, setAiTrends] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [aiHistory, setAiHistory] = useState([]);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Beijing Time helper
            const getBeijingDateStr = (date) => {
                const d = new Date(date);
                const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                const beijing = new Date(utc + (3600000 * 8));
                return beijing.toISOString().split('T')[0];
            };

            const now = new Date();
            let query = '';
            if (dateRange === '7days') {
                const start = new Date(now);
                start.setDate(now.getDate() - 7);
                query = `?startDate=${getBeijingDateStr(start)}`;
            } else if (dateRange === '30days') {
                const start = new Date(now);
                start.setDate(now.getDate() - 30);
                query = `?startDate=${getBeijingDateStr(start)}`;
            }

            const statsRes = await api.get(`/tickets/stats${query}`);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAIHistory = async () => {
        try {
            const res = await api.get('/tickets/ai-trends/history');
            setAiHistory(res.data.history || []);
        } catch (err) {
            console.error('Failed to fetch AI history:', err);
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

    const fetchAITrends = async (isRefresh = false, historyId = null) => {
        setAiLoading(true);
        setAiError(null);
        try {
            // Map dateRange to days parameter expected by AI endpoint
            let days = '30';
            if (dateRange === '7days') days = '7';
            if (dateRange === 'all') days = '90'; // Approximate 'all' to 90 days for AI context

            let url = `/tickets/ai-trends?days=${days}`;
            if (isRefresh) url += '&refresh=true';
            if (historyId) url += `&historyId=${historyId}`;

            const res = await api.get(url);

            if (res.data.needsGeneration) {
                setAiTrends(null);
            } else {
                setAiTrends(res.data);
                if (!historyId) fetchAIHistory();
            }
        } catch (err) {
            console.error('AI analysis failed:', err);
            setAiError(err.response?.data?.error || 'AI分析失败');
        } finally {
            setAiLoading(false);
        }
    };

    // Auto-fetch AI trends (load cache) when tab is opened
    useEffect(() => {
        if (activeTab === 'ai') {
            fetchAIHistory();
            if (!aiTrends) {
                fetchAITrends(false);
            }
        }
    }, [activeTab]);

    // Switch away from AI tab if disabled
    useEffect(() => {
        if (activeTab === 'ai' && (settings.ai_enabled === false || settings.ai_analysis_enabled === false)) {
            setActiveTab('stats');
        }
    }, [settings, activeTab]);

    // Helper for AI sentiment
    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'negative': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const getSentimentText = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '😊 整体积极';
            case 'negative': return '😟 需要关注';
            default: return '😐 整体中性';
        }
    };

    if (loading) {
        return (
            <div className="mobile-page">
                <header className="mobile-admin-header">
                    <h1 className="text-lg font-bold text-slate-800">数据统计</h1>
                </header>
                <Loading variant="section" text="加载中..." />
            </div>
        );
    }

    const overview = stats?.overview || {};
    const distribution = stats?.distribution || [];

    const total = parseInt(overview.total) || 0;
    const pending = parseInt(overview.pending) || 0;
    const processing = parseInt(overview.processing) || 0;
    const resolved = parseInt(overview.resolved) || 0;
    const reviewed = parseInt(overview.reviewed) || 0;
    const unreviewed = parseInt(overview.unreviewed) || 0;
    const avgRating = overview.avg_rating ? parseFloat(overview.avg_rating).toFixed(1) : null;
    const ratingCount = parseInt(overview.rating_count) || 0;

    // Calculate percentages
    const resolveRate = total > 0 ? Math.round(resolved / total * 100) : 0;
    const pendingRate = total > 0 ? Math.round(pending / total * 100) : 0;
    const processingRate = total > 0 ? Math.round(processing / total * 100) : 0;

    // Calculate max for type distribution
    const maxTypeCount = distribution.length > 0
        ? Math.max(...distribution.map(d => d.count))
        : 1;

    const statCards = [
        {
            label: '全部工单',
            value: total,
            icon: MessageSquare,
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
        },
        {
            label: '待处理',
            value: pending,
            icon: AlertCircle,
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50',
        },
        {
            label: '处理中',
            value: processing,
            icon: Clock,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
        },
        {
            label: '已解决',
            value: resolved,
            icon: CheckCircle,
            gradient: 'from-emerald-500 to-green-500',
            bgGradient: 'from-emerald-50 to-green-50',
        },
    ];

    const reviewCards = [
        {
            label: '待审核',
            value: unreviewed,
            icon: EyeOff,
            gradient: 'from-rose-500 to-pink-500',
            bgGradient: 'from-rose-50 to-pink-50',
        },
        {
            label: '已公开',
            value: reviewed,
            icon: Eye,
            gradient: 'from-teal-500 to-emerald-500',
            bgGradient: 'from-teal-50 to-emerald-50',
        },
    ];

    return (
        <div className="mobile-page">
            {/* Header with Time Filter */}
            <header className="mobile-admin-header">
                <h1 className="text-lg font-bold text-slate-800">数据统计</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="all">全部</option>
                        <option value="30days">30天</option>
                        <option value="7days">7天</option>
                    </select>
                    <button
                        onClick={fetchData}
                        className="text-sm text-indigo-600 font-medium"
                    >
                        刷新
                    </button>
                </div>
            </header>

            {/* Tab Switcher */}
            <div className="px-4 pt-4">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'stats'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <BarChart3 size={14} />
                        数据概览
                    </button>
                    {settings.ai_enabled !== false && settings.ai_analysis_enabled !== false && (
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'ai'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Sparkles size={14} />
                            AI 洞察
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'ai' ? (
                /* AI Tab Content */
                <div className="px-4 py-4 space-y-4 animate-fade-in">
                    {!aiTrends ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={32} className="text-purple-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2">AI 智能洞察</h3>
                            <p className="text-sm text-slate-500 px-6 mb-6">
                                让 AI 为您分析工单数据，提取关键趋势和改进建议
                            </p>

                            {/* History Selector in Empty State */}
                            {aiHistory.length > 0 && (
                                <div className="mb-6 px-6">
                                    <label className="block text-xs text-slate-400 mb-2">或查看历史记录</label>
                                    <select
                                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onChange={(e) => fetchAITrends(false, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>选择历史记录...</option>
                                        {aiHistory.map(h => (
                                            <option key={h.id} value={h.id}>
                                                {new Date(h.created_at).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={() => fetchAITrends(true)}
                                disabled={aiLoading}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-purple-200 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-70"
                            >
                                {aiLoading ? (
                                    <>
                                        <Clock size={18} className="animate-spin" />
                                        <span>分析中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>开始分析</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* History Selector in Loaded State */}
                            {aiHistory.length > 0 && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">历史记录</span>
                                    <select
                                        className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-[200px]"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'latest') {
                                                fetchAITrends(false);
                                            } else {
                                                fetchAITrends(false, val);
                                            }
                                        }}
                                        value={aiTrends?.isHistory ? aiTrends.id : 'latest'}
                                    >
                                        <option value="latest">最新分析</option>
                                        {aiHistory.map(h => (
                                            <option key={h.id} value={h.id}>
                                                {new Date(h.created_at).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {aiError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>{aiError}</span>
                                </div>
                            )}
                            {/* Sentiment Card */}
                            <div className={`p-4 rounded-xl border ${getSentimentColor(aiTrends.overallSentiment)}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium opacity-80">整体情绪</span>
                                    <div className="flex flex-col items-end">
                                        {aiTrends.ticketCount && <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full mb-1">分析 {aiTrends.ticketCount} 条</span>}
                                        {aiTrends.cachedAt && <span className="text-[10px] opacity-70">生成于: {new Date(aiTrends.cachedAt).toLocaleString()}</span>}
                                    </div>
                                </div>
                                <div className="text-xl font-bold">{getSentimentText(aiTrends.overallSentiment)}</div>
                            </div>

                            {/* Top Issues */}
                            {aiTrends.topIssues?.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                                        <AlertCircle size={18} className="text-amber-500" />
                                        主要问题
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiTrends.topIssues.map((issue, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <span className="bg-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-100 flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="leading-5 pt-0.5">{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Key Insights */}
                            {aiTrends.insights?.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                                        <Lightbulb size={18} className="text-yellow-500" />
                                        关键洞察
                                    </h4>
                                    <div className="space-y-2">
                                        {aiTrends.insights.map((insight, i) => (
                                            <div key={i} className="flex gap-3 text-sm text-slate-600 border-l-2 border-yellow-200 pl-3 py-1">
                                                <span>{insight}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {aiTrends.recommendations?.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                        改进建议
                                    </h4>
                                    <div className="space-y-2">
                                        {aiTrends.recommendations.map((rec, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                                                <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span className="leading-relaxed">{rec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => fetchAITrends(true)}
                                className="w-full py-2.5 text-sm text-center text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl font-medium transition-colors"
                            >
                                重新分析
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* Stats Tab Content */
                <div className="px-4 py-4 space-y-6 animate-fade-in">
                    {/* Summary Cards */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                            <BarChart3 size={16} className="text-indigo-500" />
                            工单状态统计
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {statCards.map((card, index) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-2xl bg-gradient-to-br ${card.bgGradient} border border-white/50`}
                                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
                                            <Icon size={20} className="text-white" />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-800">{card.value}</div>
                                        <div className="text-xs text-slate-500">{card.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Average Rating Card */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                            <Star size={16} className="text-amber-500" />
                            用户满意度
                        </h2>
                        <div
                            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                                        <Star size={24} className="text-white fill-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-slate-800">
                                            {avgRating || '-'}
                                            {avgRating && <span className="text-lg font-normal text-slate-500 ml-1">分</span>}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {ratingCount > 0 ? `共 ${ratingCount} 条评价` : '暂无评价'}
                                        </div>
                                    </div>
                                </div>
                                {avgRating && (
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                className={star <= Math.round(parseFloat(avgRating))
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-slate-200'}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" />
                            处理效率
                        </h2>
                        <div
                            className="p-4 rounded-2xl bg-white border border-slate-100 space-y-4"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            {/* Resolve Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">解决率</span>
                                    <span className="text-sm font-semibold text-emerald-600">{resolveRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${resolveRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Processing Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">处理中</span>
                                    <span className="text-sm font-semibold text-blue-600">{processingRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"
                                        style={{ width: `${processingRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Pending Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">待处理率</span>
                                    <span className="text-sm font-semibold text-amber-600">{pendingRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pendingRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Type Distribution */}
                    {distribution.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-500" />
                                工单类型分布
                            </h2>
                            <div
                                className="p-4 rounded-2xl bg-white border border-slate-100 space-y-3"
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                {distribution.map((item) => {
                                    const typeInfo = typeLabels[item.type] || typeLabels.other;
                                    const percentage = Math.round((item.count / maxTypeCount) * 100);
                                    return (
                                        <div key={item.type}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm text-slate-700 flex items-center gap-1.5">
                                                    <span>{typeInfo.emoji}</span>
                                                    {typeInfo.text}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-600">{item.count}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${typeInfo.color} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Review Status */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                            <Eye size={16} className="text-indigo-500" />
                            审核状态
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {reviewCards.map((card, index) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-2xl bg-gradient-to-br ${card.bgGradient} border border-white/50`}
                                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
                                            <Icon size={20} className="text-white" />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-800">{card.value}</div>
                                        <div className="text-xs text-slate-500">{card.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
