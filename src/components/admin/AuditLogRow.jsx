import React, { memo } from 'react';
import { formatDate } from '../../utils/date';
import { actionLabels, actionColors, targetTypeLabels, getDetailSummary } from '../../pages/admin/constants';

// Memoized Audit Log Row Component for better performance
const AuditLogRow = memo(({ log, onSelect }) => {
    let details = {};
    try {
        details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {};
    } catch (e) {
        details = {};
    }

    return (
        <tr
            className="hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => onSelect(log)}
        >
            <td className="p-4 text-slate-600 text-sm">
                {formatDate(log.created_at)}
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {log.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{log.username}</span>
                </div>
            </td>
            <td className="p-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-slate-100 text-slate-700'}`}>
                    {actionLabels[log.action] || log.action}
                </span>
            </td>
            <td className="p-4 text-slate-600 text-sm">
                {targetTypeLabels[log.target_type] || log.target_type}
                {log.target_id && ` #${log.target_id}`}
            </td>
            <td className="p-4 text-slate-500 text-xs font-mono">
                {log.ip_address || '-'}
            </td>
            <td className="p-4 text-slate-500 text-sm max-w-xs truncate">
                {getDetailSummary(log, details)}
            </td>
        </tr>
    );
});

AuditLogRow.displayName = 'AuditLogRow';

export default AuditLogRow;
