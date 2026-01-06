import React from 'react';
import { CheckCircle, Clock, Circle, FileText } from 'lucide-react';
import { formatDateOnly } from '../utils/date';

export default function TicketTimeline({ status, createdAt, replies = [] }) {
    const steps = [
        { key: 'pending', label: '已提交', icon: FileText },
        { key: 'processing', label: '处理中', icon: Clock },
        { key: 'resolved', label: '已解决', icon: CheckCircle },
    ];

    let currentStep = 0;
    if (status === 'processing') currentStep = 1;
    if (status === 'resolved') currentStep = 2;

    // Use latest reply time as a proxy for "Processing" or "Resolved" time if available
    const latestReplyTime = replies.length > 0 ? replies[replies.length - 1].created_at : null;

    return (
        <div className="w-full py-4 px-2">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line - Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>

                {/* Connecting Line - Progress */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                                    ${isCompleted
                                        ? 'border-indigo-500 text-indigo-600 shadow-md'
                                        : 'border-slate-200 text-slate-300'
                                    }
                                    ${isCurrent ? 'ring-4 ring-indigo-50 scale-110' : ''}
                                `}
                            >
                                {isCompleted ? (
                                    <Icon size={14} />
                                ) : (
                                    <Circle size={14} />
                                )}
                            </div>
                            <span
                                className={`mt-2 text-xs font-semibold transition-colors duration-300
                                    ${isCompleted ? 'text-indigo-700' : 'text-slate-400'}
                                `}
                            >
                                {step.label}
                            </span>

                            {/* Dates */}
                            {index === 0 && (
                                <span className="absolute top-14 text-[10px] text-slate-400 whitespace-nowrap">
                                    {formatDateOnly(createdAt)}
                                </span>
                            )}
                            {index === 1 && latestReplyTime && status !== 'pending' && (
                                <span className="absolute top-14 text-[10px] text-slate-400 whitespace-nowrap">
                                    {formatDateOnly(latestReplyTime)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
