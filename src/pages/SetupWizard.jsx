import React, { useState } from 'react';
import api, { encryptPayload, setPublicKey } from '../api';
import { Settings, Database, User, Key, CheckCircle, ChevronRight, Server, HardDrive, Sparkles } from 'lucide-react';
import Loading from '../components/Loading';

export default function SetupWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        dbType: 'mysql',
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '',
        database: 'library_feedback',
        adminUser: 'admin',
        adminPass: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            // Re-fetch key just in case
            const statusRes = await api.get('/status');
            if (statusRes.data.publicKey) {
                setPublicKey(statusRes.data.publicKey);
            }

            const payload = {
                dbConfig: {
                    type: formData.dbType,
                    host: formData.host,
                    port: parseInt(formData.port),
                    user: formData.user,
                    password: formData.password,
                    database: formData.database
                },
                adminUser: formData.adminUser,
                adminPass: formData.adminPass
            };

            const encrypted = await encryptPayload(payload);
            if (!encrypted) throw new Error("Encryption failed");

            await api.post('/setup/install', { encryptedPayload: encrypted });

            // Success
            alert("安装成功！即将跳转...");
            window.location.href = '/';
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, label: '数据库配置', icon: Database },
        { num: 2, label: '管理员账号', icon: Key }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />

            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="decorative-blob w-96 h-96 bg-white/10 -top-48 -left-48" />
                <div className="decorative-blob w-80 h-80 bg-white/10 top-1/3 -right-40" style={{ animationDelay: '2s' }} />
                <div className="decorative-blob w-64 h-64 bg-white/10 bottom-20 left-1/4" style={{ animationDelay: '4s' }} />
            </div>

            {/* Card */}
            <div className="relative w-full max-w-lg animate-slide-up">
                <div className="glass rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }} />
                        </div>
                        <div className="relative">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
                                <Settings className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">系统初始化</h1>
                            <p className="text-indigo-100">欢迎使用反馈系统</p>
                        </div>
                    </div>


                    <div className="p-8 bg-white">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-center mb-8">
                            {steps.map((s, i) => {
                                const StepIcon = s.icon;
                                const isActive = step >= s.num;
                                const isComplete = step > s.num;

                                return (
                                    <React.Fragment key={s.num}>
                                        <div className={`flex items-center gap-2 transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${isComplete
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : isActive
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-300 bg-slate-50'
                                                }`}>
                                                {isComplete ? <CheckCircle size={20} /> : <StepIcon size={18} />}
                                            </div>
                                            <span className={`font-medium text-sm hidden sm:inline ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className={`w-12 h-0.5 mx-2 rounded transition-colors duration-300 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-2 animate-fade-in">
                                <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">!</div>
                                {error}
                            </div>
                        )}

                        {/* Step 1: Database Configuration */}
                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <Database className="w-5 h-5 text-indigo-500" />
                                    数据库配置
                                </h2>

                                {/* DB Type Selector */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setFormData({ ...formData, dbType: 'mysql' })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.dbType === 'mysql'
                                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Server className={`w-6 h-6 mb-2 ${formData.dbType === 'mysql' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-bold block ${formData.dbType === 'mysql' ? 'text-indigo-700' : 'text-slate-700'}`}>MySQL</span>
                                        <span className="text-xs text-slate-400">生产环境推荐</span>
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, dbType: 'sqlite' })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.dbType === 'sqlite'
                                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <HardDrive className={`w-6 h-6 mb-2 ${formData.dbType === 'sqlite' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`font-bold block ${formData.dbType === 'sqlite' ? 'text-indigo-700' : 'text-slate-700'}`}>SQLite</span>
                                        <span className="text-xs text-slate-400">轻量级存储</span>
                                    </button>
                                </div>

                                {formData.dbType === 'mysql' ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">地址 (Host)</label>
                                                <input
                                                    className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                                    value={formData.host}
                                                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">端口</label>
                                                <input
                                                    className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                                    value={formData.port}
                                                    onChange={e => setFormData({ ...formData, port: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">数据库名</label>
                                            <input
                                                className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                                value={formData.database}
                                                onChange={e => setFormData({ ...formData, database: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">用户名</label>
                                                <input
                                                    className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                                    value={formData.user}
                                                    onChange={e => setFormData({ ...formData, user: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">密码</label>
                                                <input
                                                    type="password"
                                                    className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6 text-center animate-fade-in">
                                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white mb-4 shadow-lg">
                                            <HardDrive className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-700 mb-1">无需额外配置</h3>
                                        <p className="text-slate-500 text-sm">SQLite 数据库将作为本地文件存储在服务器中。</p>
                                        <code className="text-xs text-indigo-600 bg-indigo-100 inline-block px-3 py-1.5 rounded-lg mt-3 font-mono">
                                            server/data/library_feedback.sqlite
                                        </code>
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full btn-primary py-4 rounded-xl text-lg flex items-center justify-center gap-2"
                                >
                                    下一步
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Admin Account */}
                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <Key className="w-5 h-5 text-indigo-500" />
                                    创建超级管理员
                                </h2>

                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-700">
                                        超级管理员拥有系统的最高权限，请妥善保管账号密码。
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        <User className="inline w-4 h-4 mr-1" />
                                        管理员账号
                                    </label>
                                    <input
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                        value={formData.adminUser}
                                        onChange={e => setFormData({ ...formData, adminUser: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        <Key className="inline w-4 h-4 mr-1" />
                                        管理员密码
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full border-2 border-slate-200 rounded-xl p-3 input-focus text-slate-700"
                                        value={formData.adminPass}
                                        onChange={e => setFormData({ ...formData, adminPass: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="btn-secondary flex-1 py-4 rounded-xl"
                                    >
                                        上一步
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loading variant="inline" text="安装中..." />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                开始安装
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Glow Effect */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-pink-500/20 blur-2xl rounded-full" />
            </div>
        </div>
    );
}
