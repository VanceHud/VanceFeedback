import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Loading from '../components/Loading';

export default function AboutUs() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await api.get('/settings/public');
                setContent(res.data.about_us_content || '暂无内容');
            } catch (err) {
                console.error("Failed to fetch about us content", err);
                setContent('加载失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-500/20 to-orange-500/20 blur-3xl -z-10" />

            <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-white/50">
                <div className="p-8 md:p-12">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        返回首页
                    </button>

                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
                        关于我们
                    </h1>

                    {loading ? (
                        <Loading variant="section" className="py-20" />
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 leading-loose text-lg">
                                {content}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
