import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import api from '../api';
import Loading from './Loading';

export default function TicketRating({ ticket, onRateSuccess }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // If already rated, show the rating display
    if (ticket.rating) {
        return (
            <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-amber-700">我的评价</span>
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                className={star <= ticket.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-amber-600 font-medium ml-1">{ticket.rating}.0</span>
                </div>
                {ticket.rating_comment && (
                    <p className="text-sm text-amber-800 italic">"{ticket.rating_comment}"</p>
                )}
            </div>
        );
    }

    // Only allow rating if resolved
    if (ticket.status !== 'resolved') {
        return null;
    }

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="mt-4 w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
            >
                <Star size={18} />
                评价本次服务
            </button>
        );
    }

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await api.put(`/tickets/${ticket.id}/rate`, {
                rating,
                comment
            });
            onRateSuccess(ticket.id, rating, comment);
        } catch (err) {
            console.error('Failed to submit rating:', err);
            alert('评价提交失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 bg-white rounded-xl border-2 border-indigo-100 p-4 animate-fade-in shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400" size={16} />
                请为我们的服务评分
            </h4>

            <div className="flex items-center gap-2 mb-4 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="transition-transform hover:scale-110 focus:outline-none"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                    >
                        <Star
                            size={32}
                            className={`transition-colors ${star <= (hoverRating || rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                        />
                    </button>
                ))}
            </div>

            <div className="mb-4">
                <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="请输入您的评价内容（选填）..."
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                    取消
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <Loading variant="inline" text="提交中..." className="text-white" />
                    ) : (
                        <>
                            <Send size={14} />
                            提交评价
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
