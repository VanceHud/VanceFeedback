import React, { useState, useEffect, useRef } from 'react';
import 'altcha';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api, { encryptPayload, setPublicKey } from '../../api';
import { Lock, User, BookOpen, ArrowRight, Sparkles, Mail, Send, Hash, UserCircle, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import Loading from '../../components/Loading';

export default function MobileLogin() {
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [settings, setSettings] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        emailCode: '',
        studentId: '',
        realName: '',
        nickname: ''
    });
    const [forgotData, setForgotData] = useState({
        email: '',
        code: '',
        newPassword: '',
        step: 'email'
    });
    const [loading, setLoading] = useState(false);
    const [encryptionReady, setEncryptionReady] = useState(false);
    const [error, setError] = useState('');
    const [codeSending, setCodeSending] = useState(false);
    const [codeCountdown, setCodeCountdown] = useState(0);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [turnstileReady, setTurnstileReady] = useState(false);
    const [altchaPayload, setAltchaPayload] = useState('');
    const turnstileRef = useRef(null);
    const turnstileWidgetId = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchSettings();
        return () => {
            const script = document.getElementById('turnstile-script');
            if (script) script.remove();
            if (window.turnstile && turnstileWidgetId.current !== null) {
                try {
                    window.turnstile.remove(turnstileWidgetId.current);
                } catch (e) { }
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

    useEffect(() => {
        if (codeCountdown > 0) {
            const timer = setTimeout(() => setCodeCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [codeCountdown]);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/public');
            setSettings(res.data);
            if (res.data.publicKey) {
                setPublicKey(res.data.publicKey);
                setEncryptionReady(true);
            } else {
                setError('系统初始化失败：无法获取加密密钥');
            }
        } catch (err) {
            setError('系统连接失败，请刷新重试');
        }
    };

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
        script.onerror = () => setError('人机验证加载失败，请检查网络连接');
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
                        'error-callback': () => setError('人机验证出错，请刷新页面重试')
                    });
                }
            } catch (err) {
                setError('人机验证初始化失败');
            }
        }
    };

    const getTurnstileToken = async () => {
        if (!settings.recaptcha_enabled) return '';
        if (!turnstileReady) {
            setError('人机验证未准备好，请稍后重试');
            return '';
        }
        if (!turnstileToken) {
            setError('请完成人机验证');
            return '';
        }
        return turnstileToken;
    };

    const handleSendCode = async () => {
        if (!formData.email) {
            setError('请输入邮箱地址');
            return;
        }
        setCodeSending(true);
        setError('');
        try {
            let token = '';
            let altcha = '';

            if (settings.recaptcha_enabled) {
                if (settings.recaptcha_provider === 'altcha') {
                    if (!altchaPayload) {
                        setError('请完成人机验证');
                        setCodeSending(false);
                        return;
                    }
                    altcha = altchaPayload;
                } else {
                    token = await getTurnstileToken();
                    if (!token) {
                        setCodeSending(false);
                        return;
                    }
                }
            }

            await api.post('/verification/send-code', {
                email: formData.email,
                type: 'register',
                recaptchaToken: token,
                altcha: altcha
            });
            setCodeCountdown(60);
            setError('验证码已发送到您的邮箱');
        } catch (err) {
            setError(err.response?.data?.error || '发送失败');
        } finally {
            setCodeSending(false);
        }
    };

    const resetCaptcha = () => {
        if (window.turnstile && turnstileWidgetId.current !== null) {
            try {
                window.turnstile.reset(turnstileWidgetId.current);
                setTurnstileToken('');
            } catch (e) { }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let token = '';
            let altcha = '';
            const skipCaptcha = isRegister && settings.email_verification_enabled;

            if (!skipCaptcha) {
                if (settings.recaptcha_provider === 'altcha') {
                    if (!altchaPayload && settings.recaptcha_enabled) {
                        setError('请完成人机验证');
                        setLoading(false);
                        return;
                    }
                    altcha = altchaPayload;
                } else {
                    token = await getTurnstileToken();
                    if (!token && settings.recaptcha_enabled) {
                        setLoading(false);
                        return;
                    }
                }
            }

            const encrypted = await encryptPayload(formData);
            if (!encrypted) throw new Error("Encryption init failed");

            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const res = await api.post(endpoint, {
                encryptedPayload: encrypted,
                recaptchaToken: token,
                altcha: altcha
            });

            if (isRegister) {
                setIsRegister(false);
                setError('注册成功，请登录');
                setFormData({ username: '', password: '', email: '', emailCode: '', studentId: '', realName: '', nickname: '' });
                resetCaptcha();
            } else {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                // Navigate to the original destination or mobile home
                const from = location.state?.from || '/m';
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            if (settings.recaptcha_enabled && !isRegister) resetCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSendCode = async () => {
        if (!forgotData.email) {
            setError('请输入邮箱地址');
            return;
        }
        setCodeSending(true);
        setError('');
        try {
            const res = await api.post('/profile/forgot-password', { email: forgotData.email });
            if (res.data.customMessage) {
                setError(res.data.error);
            } else {
                setForgotData(prev => ({ ...prev, step: 'code' }));
                setCodeCountdown(60);
            }
        } catch (err) {
            setError(err.response?.data?.customMessage ? err.response.data.error : (err.response?.data?.error || '发送失败'));
        } finally {
            setCodeSending(false);
        }
    };

    const handleResetPassword = async () => {
        if (!forgotData.code || !forgotData.newPassword) {
            setError('请填写完整信息');
            return;
        }
        if (forgotData.newPassword.length < 6) {
            setError('密码至少6位');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/profile/reset-password', {
                email: forgotData.email,
                code: forgotData.code,
                newPassword: forgotData.newPassword
            });
            setForgotData(prev => ({ ...prev, step: 'success' }));
        } catch (err) {
            setError(err.response?.data?.error || '重置失败');
        } finally {
            setLoading(false);
        }
    };

    const renderForgotPassword = () => {
        if (!settings.email_verification_enabled) {
            return (
                <div className="mobile-login-content">
                    <button
                        type="button"
                        onClick={() => { setIsForgotPassword(false); setError(''); }}
                        className="mobile-login-back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Mail className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">找回密码</h3>
                        <p className="text-slate-500 mb-6 whitespace-pre-wrap px-4 leading-relaxed">
                            {settings.forgot_password_text || '请联系管理员重置密码'}
                        </p>
                        <button
                            type="button"
                            onClick={() => { setIsForgotPassword(false); setError(''); }}
                            className="mobile-login-btn"
                        >
                            返回登录
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mobile-login-content">
                <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setError(''); setForgotData({ email: '', code: '', newPassword: '', step: 'email' }); }}
                    className="mobile-login-back"
                >
                    <ArrowLeft size={20} />
                </button>

                {forgotData.step === 'email' && (
                    <>
                        <div className="mobile-login-field">
                            <label>邮箱地址</label>
                            <div className="mobile-login-input-wrapper">
                                <Mail className="mobile-login-input-icon" />
                                <input
                                    type="email"
                                    placeholder="请输入注册时使用的邮箱"
                                    value={forgotData.email}
                                    onChange={e => setForgotData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleForgotSendCode}
                            disabled={codeSending}
                            className="mobile-login-btn"
                        >
                            {codeSending ? <Loading variant="inline" /> : <Send size={20} />}
                            <span>发送验证码</span>
                        </button>
                    </>
                )}

                {forgotData.step === 'code' && (
                    <>
                        <div className="mobile-login-field">
                            <label>验证码</label>
                            <input
                                type="text"
                                className="mobile-login-code-input"
                                placeholder="000000"
                                maxLength={6}
                                value={forgotData.code}
                                onChange={e => setForgotData(prev => ({ ...prev, code: e.target.value }))}
                            />
                        </div>
                        <div className="mobile-login-field">
                            <label>新密码</label>
                            <div className="mobile-login-input-wrapper">
                                <Lock className="mobile-login-input-icon" />
                                <input
                                    type="password"
                                    placeholder="请输入新密码（至少6位）"
                                    value={forgotData.newPassword}
                                    onChange={e => setForgotData(prev => ({ ...prev, newPassword: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="mobile-login-btn"
                        >
                            {loading ? <Loading variant="inline" /> : <KeyRound size={20} />}
                            <span>重置密码</span>
                        </button>
                    </>
                )}

                {forgotData.step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">密码重置成功</h3>
                        <p className="text-slate-500 mb-6">您现在可以使用新密码登录</p>
                        <button
                            type="button"
                            onClick={() => { setIsForgotPassword(false); setForgotData({ email: '', code: '', newPassword: '', step: 'email' }); }}
                            className="mobile-login-btn"
                        >
                            返回登录
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mobile-login-page">
            {/* Animated Background */}
            <div className="mobile-login-bg" />
            <div className="mobile-login-bg-overlay" />

            {/* Decorative Circles */}
            <div className="mobile-login-decoration">
                <div className="mobile-login-circle mobile-login-circle-1" />
                <div className="mobile-login-circle mobile-login-circle-2" />
                <div className="mobile-login-circle mobile-login-circle-3" />
            </div>

            {/* Login Card */}
            <div className="mobile-login-container">
                <div className="mobile-login-card">
                    {/* Header */}
                    <div className="mobile-login-header">
                        <div className="mobile-login-logo">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="mobile-login-title">
                            {isForgotPassword ? '找回密码' : isRegister ? '创建账号' : '欢迎回来'}
                        </h1>
                        <p className="mobile-login-subtitle">
                            {settings.university_name ? `${settings.university_name}反馈系统` : '反馈系统'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`mobile-login-message ${error.includes('成功') || error.includes('已发送') ? 'success' : 'error'}`}>
                            {error.includes('成功') || error.includes('已发送') ? (
                                <Sparkles className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                            )}
                            <span>{error}</span>
                        </div>
                    )}

                    {isForgotPassword ? (
                        renderForgotPassword()
                    ) : (
                        <div className="mobile-login-content">
                            <form onSubmit={handleSubmit}>
                                {/* Username */}
                                <div className="mobile-login-field">
                                    <label>{settings.email_verification_enabled ? '用户名 / 邮箱' : '用户名'}</label>
                                    <div className="mobile-login-input-wrapper">
                                        <User className="mobile-login-input-icon" />
                                        <input
                                            type="text"
                                            required
                                            placeholder={settings.email_verification_enabled ? "请输入用户名或邮箱" : "请输入用户名"}
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="mobile-login-field">
                                    <label>密码</label>
                                    <div className="mobile-login-input-wrapper">
                                        <Lock className="mobile-login-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="请输入密码"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="mobile-login-password-toggle"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Registration Extra Fields */}
                                {isRegister && (
                                    <>
                                        {settings.email_verification_enabled && (
                                            <>
                                                <div className="mobile-login-field">
                                                    <label>邮箱</label>
                                                    <div className="mobile-login-input-row">
                                                        <div className="mobile-login-input-wrapper flex-1">
                                                            <Mail className="mobile-login-input-icon" />
                                                            <input
                                                                type="email"
                                                                required
                                                                placeholder="请输入邮箱"
                                                                value={formData.email}
                                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleSendCode}
                                                            disabled={codeSending || codeCountdown > 0}
                                                            className="mobile-login-send-btn"
                                                        >
                                                            {codeSending ? (
                                                                <Loading variant="inline" />
                                                            ) : codeCountdown > 0 ? (
                                                                `${codeCountdown}s`
                                                            ) : (
                                                                <>
                                                                    <Send size={16} />
                                                                    <span>发送</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mobile-login-field">
                                                    <label>邮箱验证码</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mobile-login-code-input"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        value={formData.emailCode}
                                                        onChange={e => setFormData({ ...formData, emailCode: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {settings.student_info_enabled && (
                                            <>
                                                <div className="mobile-login-field">
                                                    <label>学号</label>
                                                    <div className="mobile-login-input-wrapper">
                                                        <Hash className="mobile-login-input-icon" />
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="请输入学号"
                                                            value={formData.studentId}
                                                            onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mobile-login-field">
                                                    <label>姓名</label>
                                                    <div className="mobile-login-input-wrapper">
                                                        <UserCircle className="mobile-login-input-icon" />
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="请输入真实姓名"
                                                            value={formData.realName}
                                                            onChange={e => setFormData({ ...formData, realName: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Turnstile container */}
                                {settings.recaptcha_enabled && (
                                    <div className="flex justify-center my-4 w-full" style={{
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
                                    disabled={loading || !encryptionReady}
                                    className="mobile-login-btn"
                                >
                                    {loading ? (
                                        <Loading variant="inline" text="处理中..." />
                                    ) : !encryptionReady ? (
                                        <Loading variant="inline" text="初始化中..." />
                                    ) : (
                                        <>
                                            <span>{isRegister ? '立即注册' : '登录'}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="mobile-login-divider">
                                <span>或</span>
                            </div>

                            {/* Switch Mode & Forgot Password */}
                            <div className="mobile-login-actions">
                                <button
                                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                                    className="mobile-login-switch"
                                >
                                    {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
                                </button>
                                {!isRegister && (
                                    <button
                                        onClick={() => { setIsForgotPassword(true); setError(''); }}
                                        className="mobile-login-forgot"
                                    >
                                        忘记密码？
                                    </button>
                                )}
                                <Link to="/m" className="mobile-login-home">
                                    ← 返回首页
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
