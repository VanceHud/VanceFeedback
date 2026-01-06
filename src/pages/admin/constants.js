import {
    Wrench, Book, Monitor, Leaf, HelpCircle,
    Clock, CheckCircle, AlertCircle
} from 'lucide-react';

// Type icon mapping
export const typeIcons = {
    facility: Wrench,
    books: Book,
    system: Monitor,
    environment: Leaf,
    other: HelpCircle
};

// Type label mapping
export const typeLabels = {
    facility: { text: '设施报修', emoji: '🔧' },
    books: { text: '图书借阅', emoji: '📚' },
    system: { text: '数字资源', emoji: '💻' },
    environment: { text: '环境卫生', emoji: '🌿' },
    other: { text: '其他', emoji: '📝' }
};

// Status configuration
export const statusConfig = {
    pending: {
        label: '待处理',
        className: 'badge-pending',
        icon: AlertCircle,
        bgGradient: 'from-amber-50 via-orange-50 to-yellow-50'
    },
    processing: {
        label: '处理中',
        className: 'badge-processing',
        icon: Clock,
        bgGradient: 'from-blue-50 via-indigo-50 to-purple-50'
    },
    resolved: {
        label: '已解决',
        className: 'badge-resolved',
        icon: CheckCircle,
        bgGradient: 'from-emerald-50 via-green-50 to-teal-50'
    }
};

// Audit log action labels
export const actionLabels = {
    'user_login': '用户登录',
    'user_register': '用户注册',
    'delete_ticket': '删除工单',
    'change_role': '修改权限',
    'update_settings': '更新设置',
    'create_question_type': '创建问题类型',
    'update_question_type': '更新问题类型',
    'delete_question_type': '删除问题类型',
    'create_user': '创建用户',
    'update_user': '更新用户',
    'review_ticket': '审核工单',
    'batch_review_tickets': '批量审核工单'
};

// Audit log action colors
export const actionColors = {
    'user_login': 'bg-emerald-100 text-emerald-700',
    'user_register': 'bg-blue-100 text-blue-700',
    'delete_ticket': 'bg-red-100 text-red-700',
    'delete_question_type': 'bg-red-100 text-red-700',
    'change_role': 'bg-purple-100 text-purple-700',
    'update_settings': 'bg-amber-100 text-amber-700',
    'create_question_type': 'bg-indigo-100 text-indigo-700',
    'update_question_type': 'bg-cyan-100 text-cyan-700',
    'create_user': 'bg-teal-100 text-teal-700',
    'update_user': 'bg-orange-100 text-orange-700',
    'review_ticket': 'bg-violet-100 text-violet-700',
    'batch_review_tickets': 'bg-violet-100 text-violet-700'
};

// Target type labels
export const targetTypeLabels = {
    'user': '用户',
    'ticket': '工单',
    'settings': '设置',
    'question_type': '问题类型'
};

// Helper function to get detail summary
export const getDetailSummary = (log, details) => {
    switch (log.action) {
        case 'delete_ticket':
            return details.content ? `工单: ${details.content.substring(0, 20)}...` : '';
        case 'change_role':
            return `${details.username}: ${details.oldRole} → ${details.newRole}`;
        case 'update_settings':
            return details.changed_keys ? `${details.changed_keys.length}项设置` : '';
        case 'create_question_type':
        case 'update_question_type':
        case 'delete_question_type':
            return details.label ? `${details.emoji} ${details.label}` : details.type_key || '';
        case 'create_user':
            return details.username ? `用户: ${details.username}` : '';
        case 'update_user':
            return details.changes ? `${details.changes.join(', ')}` : '';
        case 'user_login':
        case 'user_register':
            return details.email ? `邮箱: ${details.email}` : (details.role || '');
        case 'review_ticket':
            return details.action || '';
        case 'batch_review_tickets':
            return details.action ? `${details.action} (${details.count}个)` : '';
        default:
            return '';
    }
};
