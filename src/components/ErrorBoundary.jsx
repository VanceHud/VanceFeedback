import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { formatDate } from '../utils/date';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // 可选：发送错误到日志服务
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    toggleDetails = () => {
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render() {
        if (this.state.hasError) {
            // Inline styles as fallback in case Tailwind CSS fails to load
            const containerStyle = {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #fef2f2, #fff7ed, #fefce8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            };

            const headerStyle = {
                background: 'linear-gradient(to right, #ef4444, #f97316)',
                padding: '1.5rem',
                color: 'white'
            };

            const buttonStyle = {
                flex: 1,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
            };

            return (
                <div style={containerStyle} className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        {/* Error Card */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div style={headerStyle} className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold">应用遇到错误</h1>
                                        <p className="text-red-100 mt-1">但不用担心，我们会帮您解决</p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            <div className="p-6 space-y-4">
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                    <div className="flex items-start gap-3">
                                        <Bug className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-red-900 mb-1">错误信息</h3>
                                            <p className="text-red-700 text-sm font-mono">
                                                {this.state.error?.toString() || '未知错误'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Details Toggle */}
                                <button
                                    onClick={this.toggleDetails}
                                    className="w-full text-left px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-between text-sm text-slate-700"
                                >
                                    <span className="font-medium">
                                        {this.state.showDetails ? '隐藏' : '查看'}技术细节
                                    </span>
                                    <span className={`transform transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {this.state.showDetails && (
                                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                                        <div className="mb-3">
                                            <div className="text-slate-400 mb-1">Stack Trace:</div>
                                            <pre className="whitespace-pre-wrap break-words">
                                                {this.state.error?.stack || 'No stack trace available'}
                                            </pre>
                                        </div>
                                        {this.state.errorInfo && (
                                            <div>
                                                <div className="text-slate-400 mb-1">Component Stack:</div>
                                                <pre className="whitespace-pre-wrap break-words">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Troubleshooting Tips */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        💡 可能的解决方法
                                    </h3>
                                    <ul className="space-y-2 text-sm text-blue-800">
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>刷新页面重新加载应用</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>清除浏览器缓存（Ctrl + Shift + R）</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>检查网络连接是否正常</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>如果问题持续，请联系管理员并提供上述技术细节</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* System Info */}
                                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="font-medium">浏览器：</span> {navigator.userAgent.split(' ').slice(-1)[0]}
                                        </div>
                                        <div>
                                            <span className="font-medium">时间：</span> {formatDate(new Date())}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="font-medium">页面：</span> {window.location.pathname}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={this.handleReload}
                                        style={{ ...buttonStyle, background: 'linear-gradient(to right, #3b82f6, #6366f1)', color: 'white' }}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <RefreshCw size={18} />
                                        刷新页面
                                    </button>
                                    <button
                                        onClick={this.handleGoHome}
                                        style={{ ...buttonStyle, background: 'white', color: '#334155', border: '2px solid #e2e8f0' }}
                                        className="flex-1 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300"
                                    >
                                        <Home size={18} />
                                        返回首页
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Additional Help */}
                        <div className="mt-4 text-center text-sm text-slate-600">
                            <p>如果问题持续出现，请截图保存错误信息并联系技术支持</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
