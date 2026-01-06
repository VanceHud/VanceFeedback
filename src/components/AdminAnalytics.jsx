import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import {
    Calendar, RefreshCw, Download, Sparkles, TrendingUp, TrendingDown, Lightbulb,
    AlertTriangle, CheckCircle, Clock, FileText, Star, Users, BarChart3
} from 'lucide-react';
import api from '../api';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const RATING_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30'); // 7, 30, 90
    const [activeTab, setActiveTab] = useState('overview'); // overview, trends, ai

    // AI Trends state
    const [aiTrends, setAiTrends] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [aiHistory, setAiHistory] = useState([]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tickets/stats?days=${dateRange}`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
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
        setAiError('');
        try {
            let url = `/tickets/ai-trends?days=${dateRange}`;
            if (isRefresh) url += '&refresh=true';
            if (historyId) url += `&historyId=${historyId}`;

            const res = await api.get(url);

            // If API says it needs generation (cache miss on auto-fetch), don't set trends yet
            if (res.data.needsGeneration) {
                setAiTrends(null);
            } else {
                setAiTrends(res.data);
                // Refresh history list after a successful fetch (in case new on was generated)
                if (!historyId) fetchAIHistory();
            }
        } catch (err) {
            console.error('Failed to fetch AI trends:', err);
            setAiError(err.response?.data?.error || err.response?.data?.message || 'AI分析失败');
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
            setActiveTab('overview');
        }
    }, [settings, activeTab]);

    const exportToCSV = () => {
        if (!data) return;

        const rows = [
            ['指标', '数值'],
            ['总工单数', data.overview.total],
            ['待处理', data.overview.pending],
            ['处理中', data.overview.processing],
            ['已解决', data.overview.resolved],
            ['已审核', data.overview.reviewed],
            ['待审核', data.overview.unreviewed],
            ['平均评分', data.overview.avg_rating || 'N/A'],
            ['评分数量', data.overview.rating_count],
            [''],
            ['日期趋势'],
            ['日期', '新建', '解决'],
            ...data.dailyTrend.map(d => [d.date, d.created, d.resolved])
        ];

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Get Beijing Date for filename
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const beijing = new Date(utc + (3600000 * 8));
        link.download = `analytics_${beijing.toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchStats();
        fetchSettings();
    }, [dateRange]);

    // Computed values
    const statusData = useMemo(() => {
        if (!data) return [];
        return [
            { name: '待处理', value: parseInt(data.overview.pending) || 0, color: '#f59e0b' },
            { name: '处理中', value: parseInt(data.overview.processing) || 0, color: '#6366f1' },
            { name: '已解决', value: parseInt(data.overview.resolved) || 0, color: '#22c55e' }
        ];
    }, [data]);

    const typeData = useMemo(() => {
        if (!data) return [];
        return data.distribution.map((item, idx) => ({
            name: getTypeLabel(item.type),
            value: parseInt(item.count) || 0,
            color: COLORS[idx % COLORS.length]
        }));
    }, [data]);

    const ratingData = useMemo(() => {
        if (!data?.ratingDistribution) return [];
        const result = [1, 2, 3, 4, 5].map(r => ({
            rating: `${r}星`,
            count: 0,
            fill: RATING_COLORS[r - 1]
        }));
        data.ratingDistribution.forEach(r => {
            const idx = parseInt(r.rating) - 1;
            if (idx >= 0 && idx < 5) {
                result[idx].count = parseInt(r.count) || 0;
            }
        });
        return result;
    }, [data]);

    const completionRate = useMemo(() => {
        if (!data) return 0;
        const total = parseInt(data.overview.total) || 0;
        const resolved = parseInt(data.overview.resolved) || 0;
        return total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
    }, [data]);

    if (loading && !data) {
        return <AnalyticsSkeleton />;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">数据分析看板</h2>
                        <p className="text-sm text-slate-500">实时统计与趋势分析</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {[
                            { value: '7', label: '7天' },
                            { value: '30', label: '30天' },
                            { value: '90', label: '90天' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDateRange(opt.value)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dateRange === opt.value
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchStats}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                        title="刷新数据"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <Download size={16} />
                        <span className="text-sm hidden sm:inline">导出</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'overview', label: '概览', icon: BarChart3 },
                    { id: 'trends', label: '趋势', icon: TrendingUp },
                    // Conditional AI Tab
                    ...(settings.ai_enabled !== false && settings.ai_analysis_enabled !== false ? [
                        { id: 'ai', label: 'AI洞察', icon: Sparkles }
                    ] : [])
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'text-indigo-600 border-indigo-600'
                            : 'text-slate-500 border-transparent hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="总工单数"
                            value={data.overview.total}
                            icon={FileText}
                            color="indigo"
                            change={data.comparison?.totalChange}
                        />
                        <StatCard
                            label="待处理"
                            value={data.overview.pending}
                            icon={Clock}
                            color="amber"
                            alert={parseInt(data.overview.pending) > 10}
                        />
                        <StatCard
                            label="平均评分"
                            value={data.overview.avg_rating ? parseFloat(data.overview.avg_rating).toFixed(1) : '-'}
                            suffix={data.overview.avg_rating ? '分' : ''}
                            icon={Star}
                            color="purple"
                            change={data.comparison?.ratingChange ? parseFloat(data.comparison.ratingChange) * 20 : null}
                        />
                        <StatCard
                            label="解决率"
                            value={completionRate}
                            suffix="%"
                            icon={CheckCircle}
                            color="emerald"
                        />
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MiniStatCard label="处理中" value={data.overview.processing} color="blue" />
                        <MiniStatCard label="已审核" value={data.overview.reviewed} color="green" />
                        <MiniStatCard label="待审核" value={data.overview.unreviewed} color="orange" />
                        <MiniStatCard label="评分数" value={data.overview.rating_count} color="purple" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution Pie */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">工单状态分布</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value, '数量']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Type Distribution Bar */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">工单类型分布</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={typeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    {ratingData.some(r => r.count > 0) && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">评分分布</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ratingData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [value, '数量']}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {ratingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Daily Trend Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">
                            工单趋势 <span className="text-sm font-normal text-slate-400">（最近 {dateRange} 天）</span>
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={(d) => d.slice(5)}
                                    />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(d) => `日期: ${d}`}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="created"
                                        name="新建工单"
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorCreated)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="resolved"
                                        name="解决工单"
                                        stroke="#22c55e"
                                        fillOpacity={1}
                                        fill="url(#colorResolved)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Stats for Trend Period */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-100">
                            <p className="text-sm text-indigo-600 font-medium mb-1">期间新建工单</p>
                            <p className="text-2xl font-bold text-indigo-700">
                                {data.dailyTrend.reduce((sum, d) => sum + d.created, 0)}
                            </p>
                            {data.comparison?.totalChange !== undefined && (
                                <p className={`text-sm mt-1 flex items-center gap-1 ${data.comparison.totalChange >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {data.comparison.totalChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    较上期 {Math.abs(data.comparison.totalChange)}%
                                </p>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-100">
                            <p className="text-sm text-emerald-600 font-medium mb-1">期间解决工单</p>
                            <p className="text-2xl font-bold text-emerald-700">
                                {data.dailyTrend.reduce((sum, d) => sum + d.resolved, 0)}
                            </p>
                            {data.comparison?.resolvedChange !== undefined && (
                                <p className={`text-sm mt-1 flex items-center gap-1 ${data.comparison.resolvedChange >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {data.comparison.resolvedChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    较上期 {Math.abs(data.comparison.resolvedChange)}%
                                </p>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-100">
                            <p className="text-sm text-purple-600 font-medium mb-1">日均工单量</p>
                            <p className="text-2xl font-bold text-purple-700">
                                {(data.dailyTrend.reduce((sum, d) => sum + d.created, 0) / parseInt(dateRange)).toFixed(1)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
                <div className="animate-fade-in">
                    <AIInsightsPanel
                        aiTrends={aiTrends}
                        aiLoading={aiLoading}
                        aiError={aiError}
                        aiHistory={aiHistory}
                        onFetch={fetchAITrends}
                    />
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, suffix = '', icon: Icon, color, change, alert }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} ${alert ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-80">{label}</p>
                {Icon && <Icon size={18} className="opacity-60" />}
            </div>
            <p className="text-2xl font-bold">
                {value}<span className="text-sm font-normal ml-1">{suffix}</span>
            </p>
            {change !== null && change !== undefined && (
                <p className={`text-xs mt-1 flex items-center gap-0.5 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {change >= 0 ? '+' : ''}{change}%
                </p>
            )}
        </div>
    );
};

// Mini Stat Card
const MiniStatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        orange: 'bg-orange-50 text-orange-700',
        purple: 'bg-purple-50 text-purple-700',
    };
    return (
        <div className={`p-3 rounded-lg ${colors[color]}`}>
            <p className="text-xs opacity-70">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
};

// AI Insights Panel
const AIInsightsPanel = ({ aiTrends, aiLoading, aiError, aiHistory, onFetch }) => {
    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'text-emerald-600 bg-emerald-50';
            case 'negative': return 'text-red-600 bg-red-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getSentimentText = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '😊 整体积极';
            case 'negative': return '😟 需要关注';
            default: return '😐 整体中性';
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">AI 智能洞察</h3>
                        <p className="text-sm text-slate-500">
                            {aiTrends?.cachedAt
                                ? `生成于: ${new Date(aiTrends.cachedAt).toLocaleString()}`
                                : '基于工单数据的AI分析和建议'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* History Dropdown */}
                    {aiHistory && aiHistory.length > 0 && (
                        <select
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'latest') {
                                    onFetch(false); // Fetch latest (cache or new)
                                } else {
                                    onFetch(false, val); // Fetch specific history
                                }
                            }}
                            defaultValue={aiTrends?.isHistory ? aiTrends.id : 'latest'}
                        >
                            <option value="latest">最新分析</option>
                            {aiHistory.map(h => (
                                <option key={h.id} value={h.id}>
                                    {new Date(h.created_at).toLocaleString()}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => onFetch(true)} // Force refresh
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {aiLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                分析中
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                重新生成
                            </>
                        )}
                    </button>
                </div>
            </div>

            {aiError && (
                <div className="p-4 mb-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {aiError}
                </div>
            )}

            {aiTrends ? (
                <div className="space-y-6">
                    {/* Overall Sentiment & Ticket Count */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl ${getSentimentColor(aiTrends.overallSentiment)}`}>
                            <p className="text-sm font-medium mb-1">整体情绪</p>
                            <p className="text-xl font-bold">{getSentimentText(aiTrends.overallSentiment)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50 text-indigo-700">
                            <p className="text-sm font-medium mb-1">分析工单数</p>
                            <p className="text-xl font-bold">{aiTrends.ticketCount} 条</p>
                        </div>
                    </div>

                    {/* Top Issues */}
                    {aiTrends.topIssues?.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-100">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-500" />
                                主要问题
                            </h4>
                            <ul className="space-y-2">
                                {aiTrends.topIssues.map((issue, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-600">
                                        <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mt-0.5">{i + 1}</span>
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Trends */}
                    {aiTrends.trends?.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-100">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-500" />
                                趋势分析
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {aiTrends.trends.map((trend, i) => (
                                    <div key={i} className="p-3 bg-blue-50 rounded-lg">
                                        <p className="font-medium text-blue-800">{trend.topic}</p>
                                        <p className="text-sm text-blue-600 mt-1">{trend.description}</p>
                                        {trend.count && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">涉及 ~{trend.count} 条</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {aiTrends.insights?.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-100">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Lightbulb size={18} className="text-yellow-500" />
                                关键洞察
                            </h4>
                            <ul className="space-y-2">
                                {aiTrends.insights.map((insight, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-600">
                                        <span className="text-yellow-500 mt-0.5">💡</span>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {aiTrends.recommendations?.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-100">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <CheckCircle size={18} className="text-emerald-500" />
                                改进建议
                            </h4>
                            <ul className="space-y-2">
                                {aiTrends.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-600">
                                        <span className="text-emerald-500 mt-0.5">✅</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <Sparkles size={40} className="mx-auto mb-3 text-purple-300" />
                    <p>点击上方按钮，让 AI 为您分析工单数据并提供洞察</p>
                </div>
            )}
        </div>
    );
};

// Skeleton loader
const AnalyticsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
            </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-100 rounded-2xl"></div>
            <div className="h-72 bg-slate-100 rounded-2xl"></div>
        </div>
    </div>
);

const getTypeLabel = (type) => {
    const labels = {
        'facility': '设施报修',
        'books': '图书借阅',
        'system': '数字资源',
        'environment': '环境卫生',
        'other': '其他'
    };
    return labels[type] || type;
};

export default AdminAnalytics;
