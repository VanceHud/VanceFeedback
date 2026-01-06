import React, { useEffect, useState, useRef, useCallback } from 'react';
import 'altcha';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogOut, FileText, Settings, User as UserIcon, Send, MapPin, Phone, ChevronRight, PlusCircle, Clock, CheckCircle, AlertCircle, Home, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';
import UserCenter from './UserCenter';
import Loading from '../components/Loading';
import TicketRating from '../components/TicketRating';
import TicketTimeline from '../components/TicketTimeline';
import { debounce } from '../utils/debounce';
import { formatDate, formatDateOnly } from '../utils/date';

function MyFeedback() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeLabels, setTypeLabels] = useState({});
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        // Load question types first
        api.get('/question-types').then(res => {
            const labels = {};
            res.data.forEach(t => {
                labels[t.type_key] = { text: t.label, emoji: t.emoji };
            });
            setTypeLabels(labels);
        });

        fetchTickets(1);
    }, []);

    const fetchTickets = (page) => {
        setLoading(true);
        api.get('/tickets', { params: { userId: user.id, page, limit: 5 } })
            .then(res => {
                if (res.data.pagination) {
                    setTickets(res.data.tickets);
                    setPagination(res.data.pagination);
                } else {
                    // Fallback for non-paginated response (if any)
                    setTickets(res.data);
                }
            })
            .finally(() => setLoading(false));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchTickets(newPage);
            window.scrollTo(0, 0);
        }
    };

    const handleRateSuccess = (ticketId, rating, comment) => {
        setTickets(prev => prev.map(t =>
            t.id === ticketId
                ? { ...t, rating, rating_comment: comment }
                : t
        ));
    };

    const statusLabels = {
        pending: { text: '待处理', color: 'badge-pending', icon: AlertCircle },
        processing: { text: '处理中', color: 'badge-processing', icon: Clock },
        resolved: { text: '已解决', color: 'badge-resolved', icon: CheckCircle }
    };

    if (loading) {
        return <Loading variant="section" text="正在加载..." />;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    📋 我的反馈记录
                </h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    共 {pagination.total} 条
                </span>
            </div>

            <div className="space-y-4">
                {tickets.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl text-center shadow-card border border-slate-100">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 mb-4">暂无反馈记录</p>
                        <Link to="/dashboard/submit" className="btn-primary inline-flex items-center gap-2 py-2 px-4">
                            <PlusCircle className="w-4 h-4" />
                            提交第一条反馈
                        </Link>
                    </div>
                )}

                {tickets.map((t, index) => {
                    const status = statusLabels[t.status] || statusLabels.pending;
                    const typeInfo = typeLabels[t.type] || typeLabels.other || { text: '其他', emoji: '📝' };
                    const StatusIcon = status.icon;
                    const replies = t.replies || [];

                    return (
                        <div
                            key={t.id}
                            className="stagger-item bg-white p-6 rounded-2xl shadow-card border border-slate-100 card-hover"
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{typeInfo.emoji}</span>
                                    <span className="font-bold text-indigo-700">{typeInfo.text}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                                        <StatusIcon size={14} />
                                        {status.text}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        {formatDateOnly(t.created_at)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-700 leading-relaxed mb-4">{t.content}</p>

                            {t.location && (
                                <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                                    <MapPin size={14} className="text-slate-400" />
                                    {t.location}
                                </p>
                            )}

                            {/* Timeline */}
                            <div className="mb-6 px-2">
                                <TicketTimeline
                                    status={t.status}
                                    createdAt={t.created_at}
                                    replies={t.replies}
                                />
                            </div>

                            {/* Multiple Replies Display */}
                            {replies.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                        💬 管理员回复 ({replies.length})
                                    </p>
                                    {replies.map(reply => (
                                        <div
                                            key={reply.id}
                                            className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-indigo-400"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {reply.admin_name?.charAt(0) || 'A'}
                                                </div>
                                                <span className="text-sm font-medium text-indigo-700">{reply.admin_name}</span>
                                                <span className="text-xs text-slate-400">
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 pl-8">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Legacy single reply fallback */}
                            {replies.length === 0 && t.reply && (
                                <div className="mt-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-indigo-400">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-indigo-700">{t.reply_by || '管理员'}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{t.reply}</p>
                                </div>
                            )}

                            {/* Rating Component */}
                            <TicketRating ticket={t} onRateSuccess={handleRateSuccess} />
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        上一页
                    </button>
                    <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        下一页
                    </button>
                </div>
            )}
            <div className="h-4"></div>
        </div>
    );
}

function SubmitFeedback() {
    const [formData, setFormData] = useState({ type: '', content: '', location: '', contact: '' });
    const [loading, setLoading] = useState(false);
    const [typeOptions, setTypeOptions] = useState([]);
    const [settings, setSettings] = useState({});
    const [turnstileToken, setTurnstileToken] = useState('');
    const [turnstileReady, setTurnstileReady] = useState(false);
    const [altchaPayload, setAltchaPayload] = useState('');
    const [error, setError] = useState('');
    const [emailNotify, setEmailNotify] = useState(false);
    // Similar ticket search states
    const [similarTickets, setSimilarTickets] = useState([]);
    const [searchingSimilar, setSearchingSimilar] = useState(false);
    const [showSimilar, setShowSimilar] = useState(false);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    const turnstileRef = useRef(null);
    const turnstileWidgetId = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch fresh profile to get notification setting
        api.get('/profile').then(res => {
            if (res.data.email_notification_enabled !== undefined) {
                setEmailNotify(res.data.email_notification_enabled === 1);
            }
        }).catch(() => { });
        // Fetch question types
        api.get('/question-types').then(res => {
            const types = res.data.map(t => ({
                value: t.type_key,
                label: t.label,
                emoji: t.emoji,
                desc: t.description || ''
            }));
            setTypeOptions(types);
            if (types.length > 0 && !formData.type) {
                setFormData(prev => ({ ...prev, type: types[0].value }));
            }
        });

        // Fetch settings for Turnstile
        api.get('/settings/public').then(res => {
            setSettings(res.data);
        }).catch(err => console.error('Failed to load settings:', err));

        // Cleanup Turnstile on unmount
        return () => {
            const script = document.getElementById('turnstile-script');
            if (script) {
                script.remove();
            }
            if (window.turnstile && turnstileWidgetId.current !== null) {
                try {
                    window.turnstile.remove(turnstileWidgetId.current);
                } catch (e) {
                    // Ignore errors
                }
            }
        };
    }, []);

    // Search for similar tickets
    const searchSimilarTickets = useCallback(async (content, type) => {
        if (!content || content.trim().length < 10) {
            setSimilarTickets([]);
            setShowSimilar(false);
            return;
        }

        setSearchingSimilar(true);
        try {
            const res = await api.get('/tickets/search-similar', {
                params: { content, type, limit: 5 }
            });
            setSimilarTickets(res.data.similar_tickets || []);
            setShowSimilar(true);
        } catch (err) {
            console.error('Failed to search similar tickets:', err);
            setSimilarTickets([]);
        } finally {
            setSearchingSimilar(false);
        }
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((content, type) => {
            searchSimilarTickets(content, type);
        }, 500),
        [searchSimilarTickets]
    );

    useEffect(() => {
        if (settings.recaptcha_enabled && settings.recaptcha_site_key) {
            loadTurnstileScript();
        }
    }, [settings]);

    useEffect(() => {
        if (settings.recaptcha_enabled && settings.recaptcha_provider === 'altcha') {
            const handleStateChange = (ev) => {
                if (ev.detail.state === 'verified') {
                    setAltchaPayload(ev.detail.payload);
                    if (error === '请完成人机验证') setError('');
                }
            };
            const widget = document.querySelector('altcha-widget');
            if (widget) {
                widget.addEventListener('statechange', handleStateChange);
                return () => widget.removeEventListener('statechange', handleStateChange);
            }
        }
    }, [settings.recaptcha_provider, settings.recaptcha_enabled, error]);

    const loadTurnstileScript = () => {
        if (document.getElementById('turnstile-script')) {
            if (window.turnstile) {
                initTurnstile();
            }
            return;
        }

        const script = document.createElement('script');
        script.id = 'turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => initTurnstile();
        document.head.appendChild(script);
    };

    const initTurnstile = () => {
        if (!window.turnstile) return;
        setTurnstileReady(true);
        if (turnstileRef.current) {
            try {
                if (turnstileWidgetId.current !== null) {
                    window.turnstile.reset(turnstileWidgetId.current);
                } else {
                    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
                        sitekey: settings.recaptcha_site_key,
                        callback: (token) => setTurnstileToken(token),
                        'expired-callback': () => setTurnstileToken(''),
                    });
                }
            } catch (err) {
                console.error('Failed to render Turnstile:', err);
            }
        }
    };

    const getTurnstileToken = async () => {
        if (!settings.recaptcha_enabled) return null;

        if (!turnstileReady) {
            setError('人机验证未准备好，请稍后重试');
            throw new Error('Turnstile not ready');
        }

        if (!turnstileToken) {
            setError('请完成人机验证');
            throw new Error('Missing Turnstile token');
        }
        return turnstileToken;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let token = '';
            let altcha = '';

            if (settings.recaptcha_enabled) {
                if (settings.recaptcha_provider === 'altcha') {
                    if (!altchaPayload) {
                        setError('请完成人机验证');
                        setLoading(false);
                        return;
                    }
                    altcha = altchaPayload;
                } else {
                    token = await getTurnstileToken();
                }
            }

            // Sync notification setting if feature enabled
            if (settings.email_notifications_feature_enabled) {
                await api.put('/profile/notification-settings', { email_notification_enabled: emailNotify ? 1 : 0 });
            }

            await api.post('/tickets', {
                ...formData,
                userId: user.id,
                recaptchaToken: token,
                altcha: altcha
            });
            navigate('/dashboard/my');
        } catch (err) {
            console.error(err);
            if (err.message !== 'Missing Turnstile token' && err.message !== 'Turnstile not ready') {
                setError(err.response?.data?.error || '提交失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    ✨ 提交新反馈
                    {settings.email_notifications_feature_enabled && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm font-normal text-slate-500 hidden sm:inline">邮件通知</span>
                            <button
                                type="button"
                                onClick={() => setEmailNotify(!emailNotify)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotify ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotify ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">问题类型</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: opt.value })}
                                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.type === opt.value
                                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-2xl block mb-1">{opt.emoji}</span>
                                    <span className={`text-sm font-semibold ${formData.type === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {opt.label}
                                    </span>
                                    <span className="text-xs text-slate-400 block mt-0.5">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">问题描述</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full border-2 border-slate-200 rounded-xl p-4 input-focus resize-none text-slate-700 placeholder-slate-400"
                            placeholder="请详细描述您遇到的问题..."
                            value={formData.content}
                            onChange={e => {
                                const newContent = e.target.value;
                                setFormData({ ...formData, content: newContent });
                                // Trigger debounced search
                                debouncedSearch(newContent, formData.type);
                            }}
                        />
                    </div>

                    {/* Similar Tickets Section */}
                    {(searchingSimilar || (showSimilar && formData.content.trim().length >= 10)) && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Search className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-semibold text-indigo-900">
                                    {searchingSimilar ? '正在搜索相似问题...' : '发现类似已解决问题'}
                                </h3>
                            </div>

                            {searchingSimilar ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loading variant="inline" text="搜索中..." className="text-indigo-600" />
                                </div>
                            ) : similarTickets.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-indigo-700 mb-3">
                                        💡 找到 {similarTickets.length} 个相似问题，也许能帮到您：
                                    </p>
                                    {similarTickets.map((ticket, index) => {
                                        const isExpanded = expandedTicketId === ticket.id;
                                        const typeInfo = typeOptions.find(t => t.value === ticket.type);
                                        const replies = ticket.replies || [];

                                        return (
                                            <div
                                                key={ticket.id}
                                                className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm animate-slide-up"
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                            >
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {typeInfo && (
                                                                <span className="text-sm px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                                                    {typeInfo.emoji} {typeInfo.label}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                                <CheckCircle size={12} />
                                                                已解决
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm text-slate-700 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                                            {ticket.content}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                                        className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp size={18} className="text-slate-400" />
                                                        ) : (
                                                            <ChevronDown size={18} className="text-slate-400" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
                                                        {ticket.location && (
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                {ticket.location}
                                                            </p>
                                                        )}

                                                        {/* Replies */}
                                                        {replies.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="text-xs font-semibold text-slate-600 mb-2">
                                                                    💬 管理员回复 ({replies.length})
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {replies.map(reply => (
                                                                        <div
                                                                            key={reply.id}
                                                                            className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border-l-3 border-emerald-400"
                                                                        >
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                                    {reply.admin_name?.charAt(0) || 'A'}
                                                                                </div>
                                                                                <span className="text-xs font-medium text-emerald-700">
                                                                                    {reply.admin_name}
                                                                                </span>
                                                                                <span className="text-xs text-slate-400">
                                                                                    {formatDateOnly(reply.created_at)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-slate-600 pl-7">
                                                                                {reply.content}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-slate-400 mt-2">
                                                            提交于 {formatDateOnly(ticket.created_at)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-500">😊 未找到类似问题，您的问题可能是首次提出</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Location & Contact */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <MapPin className="inline w-4 h-4 mr-1" />
                                地点 (选填)
                            </label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700 placeholder-slate-400"
                                placeholder="如：三楼自习室"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <Phone className="inline w-4 h-4 mr-1" />
                                联系方式 (选填)
                            </label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700 placeholder-slate-400"
                                placeholder="手机号或邮箱"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Turnstile container */}
                    {settings.recaptcha_enabled && (
                        <div className="flex justify-center w-full" style={{
                            '--altcha-color-base': '#ffffff',
                            '--altcha-color-border': '#e2e8f0',
                            '--altcha-color-text': '#1e293b',
                            '--altcha-border-radius': '0.75rem',
                            '--altcha-color-primary': '#6366f1',
                            '--altcha-max-width': '100%',
                        }}>
                            {settings.recaptcha_provider === 'altcha' ? (
                                <altcha-widget
                                    challengeurl={`${api.defaults.baseURL}/captcha/challenge`}
                                    hidelogo
                                    hidefooter
                                    strings='{"label": "人机验证", "verifying": "正在验证...", "verified": "验证通过", "error": "验证出错"}'
                                    className="w-full"
                                ></altcha-widget>
                            ) : (
                                <div ref={turnstileRef}></div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loading variant="inline" text="提交中..." className="text-white" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                提交反馈
                            </>
                        )}
                    </button>
                </form>
            </div >
        </div >
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    const menuItems = [
        { path: '/dashboard/submit', label: '我要反馈', icon: PlusCircle, emoji: '✨' },
        { path: '/dashboard/my', label: '我的记录', icon: FileText, emoji: '📋' },
        { path: '/dashboard/profile', label: '用户中心', icon: UserIcon, emoji: '👤' },
    ];

    if (isAdmin) {
        menuItems.push({ path: '/admin', label: '管理后台', icon: Settings, emoji: '⚙️' });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Top Navigation */}
            <nav className="glass sticky top-0 z-50 border-b border-slate-200/50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            首页
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {user.username?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{user.username}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="退出登录"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-2 sticky top-20">
                        <nav className="space-y-1">
                            {menuItems.map(item => {
                                const isActive = location.pathname === item.path ||
                                    (item.path === '/dashboard/submit' && location.pathname === '/dashboard');

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="text-lg">{item.emoji}</span>
                                        <span className="font-medium flex-1">{item.label}</span>
                                        <ChevronRight
                                            size={16}
                                            className={`transition-transform ${isActive ? 'text-white/80' : 'text-slate-400 group-hover:translate-x-1'}`}
                                        />
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <Routes>
                        <Route path="/" element={<Navigate to="submit" replace />} />
                        <Route path="submit" element={<SubmitFeedback />} />
                        <Route path="my" element={<MyFeedback />} />
                        <Route path="profile" element={<UserCenter embedded />} />
                        {isAdmin && <Route path="admin" element={<Navigate to="/admin" replace />} />}
                    </Routes>
                </div>
            </div>
        </div>
    );
}
