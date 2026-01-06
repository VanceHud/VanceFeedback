import React, { useEffect, useState, useRef, useCallback } from 'react';
import 'altcha';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Send, MapPin, Phone, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, FileText, PlusCircle } from 'lucide-react';
import Loading from '../../components/Loading';
import { formatDate, formatDateOnly } from '../../utils/date';
import { debounce } from '../../utils/debounce';

// Submit Feedback Tab
function SubmitTab() {
    const [formData, setFormData] = useState({ type: '', content: '', location: '', contact: '' });
    const [loading, setLoading] = useState(false);
    const [typeOptions, setTypeOptions] = useState([]);
    const [settings, setSettings] = useState({});
    const [turnstileToken, setTurnstileToken] = useState('');
    const [turnstileReady, setTurnstileReady] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [altchaPayload, setAltchaPayload] = useState('');
    const turnstileRef = useRef(null);
    const turnstileWidgetId = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/m/login', { state: { from: '/m/feedback' } });
            return;
        }

        api.get('/question-types').then(res => {
            const types = res.data.map(t => ({
                value: t.type_key,
                label: t.label,
                emoji: t.emoji,
            }));
            setTypeOptions(types);
            if (types.length > 0 && !formData.type) {
                setFormData(prev => ({ ...prev, type: types[0].value }));
            }
        });

        api.get('/settings/public').then(res => {
            setSettings(res.data);
        }).catch(console.error);

        return () => {
            if (window.turnstile && turnstileWidgetId.current !== null) {
                try { window.turnstile.remove(turnstileWidgetId.current); } catch (e) { }
            }
        };
    }, []);

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
            if (window.turnstile) initTurnstile();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/m/login');
            return;
        }
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
                    // Turnstile logic
                    if (!turnstileReady) throw new Error('Turnstile not ready');
                    if (!turnstileToken) throw new Error('Missing Turnstile token');
                    token = turnstileToken;
                }
            }

            await api.post('/tickets', {
                ...formData,
                userId: user.id,
                recaptchaToken: token,
                altcha: altcha
            });
            setSuccess(true);
            setFormData({ type: typeOptions[0]?.value || '', content: '', location: '', contact: '' });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || '提交失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4">
            <div className="mobile-card">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PlusCircle size={20} className="text-indigo-500" />
                    提交新反馈
                </h2>

                {success && (
                    <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2 border border-emerald-100">
                        <CheckCircle size={16} />
                        反馈提交成功！
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">问题类型</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: opt.value })}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.type === opt.value
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-xl block">{opt.emoji}</span>
                                    <span className={`text-xs font-medium mt-1 block ${formData.type === opt.value ? 'text-indigo-700' : 'text-slate-600'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">问题描述</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm input-focus resize-none"
                            placeholder="请详细描述您遇到的问题..."
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    {/* Location & Contact */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                <MapPin size={12} className="inline mr-1" />地点 (选填)
                            </label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm input-focus"
                                placeholder="如：三楼自习室"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                <Phone size={12} className="inline mr-1" />联系方式 (选填)
                            </label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm input-focus"
                                placeholder="手机号或邮箱"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Turnstile */}
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
                        className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loading variant="inline" text="提交中..." className="text-white" />
                        ) : (
                            <>
                                <Send size={18} />
                                提交反馈
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// My Feedback Tab
function MyFeedbackTab() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeLabels, setTypeLabels] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/m/login', { state: { from: '/m/feedback' } });
            return;
        }

        api.get('/question-types').then(res => {
            const labels = {};
            res.data.forEach(t => {
                labels[t.type_key] = { text: t.label, emoji: t.emoji };
            });
            setTypeLabels(labels);
        });

        fetchTickets();
    }, []);

    const fetchTickets = () => {
        setLoading(true);
        api.get('/tickets', { params: { userId: user.id, limit: 20 } })
            .then(res => {
                if (res.data.pagination) {
                    setTickets(res.data.tickets);
                } else {
                    setTickets(res.data);
                }
            })
            .finally(() => setLoading(false));
    };

    const statusLabels = {
        pending: { text: '待处理', color: 'badge-pending', icon: AlertCircle },
        processing: { text: '处理中', color: 'badge-processing', icon: Clock },
        resolved: { text: '已解决', color: 'badge-resolved', icon: CheckCircle }
    };

    if (!user) return null;

    if (loading) {
        return <Loading variant="section" text="加载中..." />;
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                我的反馈记录
                <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    共 {tickets.length} 条
                </span>
            </h2>

            {tickets.length === 0 ? (
                <div className="mobile-card text-center py-8">
                    <FileText size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm">暂无反馈记录</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const status = statusLabels[ticket.status] || statusLabels.pending;
                        const typeInfo = typeLabels[ticket.type] || { text: '其他', emoji: '📝' };
                        const StatusIcon = status.icon;
                        const replies = ticket.replies || [];
                        const isExpanded = expandedId === ticket.id;

                        return (
                            <div key={ticket.id} className="mobile-card">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{typeInfo.emoji}</span>
                                            <span className="text-sm font-medium text-indigo-700">{typeInfo.text}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon size={10} />
                                                {status.text}
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </div>
                                    </div>
                                    <p className={`text-sm text-slate-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {ticket.content}
                                    </p>
                                    <div className="text-xs text-slate-400 mt-2">
                                        {formatDateOnly(ticket.created_at)}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && replies.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                        <p className="text-xs font-semibold text-slate-600">
                                            💬 管理员回复 ({replies.length})
                                        </p>
                                        {replies.map(reply => (
                                            <div
                                                key={reply.id}
                                                className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border-l-3 border-indigo-400"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {reply.admin_name?.charAt(0) || 'A'}
                                                    </div>
                                                    <span className="text-xs font-medium text-indigo-700">{reply.admin_name}</span>
                                                    <span className="text-xs text-slate-400">{formatDateOnly(reply.created_at)}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 pl-7">{reply.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function MobileFeedback() {
    const [activeTab, setActiveTab] = useState('submit');

    return (
        <div className="mobile-page">
            {/* Tab Switcher */}
            <div className="mobile-tabs">
                <button
                    className={`mobile-tab ${activeTab === 'submit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('submit')}
                >
                    <PlusCircle size={16} />
                    我要反馈
                </button>
                <button
                    className={`mobile-tab ${activeTab === 'my' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my')}
                >
                    <FileText size={16} />
                    我的记录
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'submit' ? <SubmitTab /> : <MyFeedbackTab />}
        </div>
    );
}
