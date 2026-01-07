import React, { useState, useEffect } from 'react';
import api from '../../api';
import { formatDate } from '../../utils/date';
import { Book, Plus, Edit, Trash2, X, CheckCircle, AlertCircle, Eye, EyeOff, FolderPlus, FileText, Search } from 'lucide-react';
import Loading from '../../components/Loading';

export default function AdminKnowledgeBase() {
    const [activeTab, setActiveTab] = useState('articles');
    const [categories, setCategories] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingArticle, setEditingArticle] = useState(null);

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '📁', sort_order: 0, is_active: 1 });
    const [articleForm, setArticleForm] = useState({ title: '', category_id: '', content: '', is_published: 0 });

    // Search/filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        fetchCategories();
        fetchArticles();
    }, []);

    useEffect(() => {
        fetchArticles(1);
    }, [filterCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/knowledge-base/admin/categories');
            setCategories(res.data);
        } catch (err) {
            setError('加载分类失败');
        }
    };

    const fetchArticles = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filterCategory) params.category = filterCategory;
            if (searchQuery) params.search = searchQuery;
            const res = await api.get('/knowledge-base/admin/articles', { params });
            setArticles(res.data.articles);
            setPagination(res.data.pagination);
        } catch (err) {
            setError('加载文章失败');
        } finally {
            setLoading(false);
        }
    };

    // Category handlers
    const openCreateCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', icon: '📁', sort_order: 0, is_active: 1 });
        setShowCategoryModal(true);
    };

    const openEditCategory = (cat) => {
        setEditingCategory(cat);
        setCategoryForm({
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || '📁',
            sort_order: cat.sort_order || 0,
            is_active: cat.is_active
        });
        setShowCategoryModal(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingCategory) {
                await api.put(`/knowledge-base/admin/categories/${editingCategory.id}`, categoryForm);
                setSuccess('分类更新成功');
            } else {
                await api.post('/knowledge-base/admin/categories', categoryForm);
                setSuccess('分类创建成功');
            }
            setShowCategoryModal(false);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || '操作失败');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('确定要删除该分类吗？')) return;
        try {
            await api.delete(`/knowledge-base/admin/categories/${id}`);
            setSuccess('分类删除成功');
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || '删除失败');
        }
    };

    const handleToggleCategory = async (cat) => {
        try {
            await api.put(`/knowledge-base/admin/categories/${cat.id}`, { is_active: cat.is_active ? 0 : 1 });
            setSuccess('状态更新成功');
            fetchCategories();
        } catch (err) {
            setError('操作失败');
        }
    };

    // Article handlers
    const openCreateArticle = () => {
        setEditingArticle(null);
        setArticleForm({ title: '', category_id: '', content: '', is_published: 0 });
        setShowArticleModal(true);
    };

    const openEditArticle = (article) => {
        setEditingArticle(article);
        setArticleForm({
            title: article.title,
            category_id: article.category_id || '',
            content: article.content,
            is_published: article.is_published
        });
        setShowArticleModal(true);
    };

    const handleSaveArticle = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = { ...articleForm, category_id: articleForm.category_id || null };
            if (editingArticle) {
                await api.put(`/knowledge-base/admin/articles/${editingArticle.id}`, data);
                setSuccess('文章更新成功');
            } else {
                await api.post('/knowledge-base/admin/articles', data);
                setSuccess('文章创建成功');
            }
            setShowArticleModal(false);
            fetchArticles(pagination.page);
        } catch (err) {
            setError(err.response?.data?.error || '操作失败');
        }
    };

    const handleDeleteArticle = async (id) => {
        if (!confirm('确定要删除该文章吗？')) return;
        try {
            await api.delete(`/knowledge-base/admin/articles/${id}`);
            setSuccess('文章删除成功');
            fetchArticles(pagination.page);
        } catch (err) {
            setError(err.response?.data?.error || '删除失败');
        }
    };

    const handleToggleArticle = async (article) => {
        try {
            await api.put(`/knowledge-base/admin/articles/${article.id}/toggle`);
            setSuccess('状态更新成功');
            fetchArticles(pagination.page);
        } catch (err) {
            setError('操作失败');
        }
    };

    // Auto-clear messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
                        <Book className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">知识库管理</h1>
                        <p className="text-sm text-slate-500">管理 FAQ 文章和分类</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-card border border-slate-100 mb-6">
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'articles'
                                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FileText size={18} />
                        文章管理
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'categories'
                                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FolderPlus size={18} />
                        分类管理
                    </button>
                </div>

                {/* Articles Tab */}
                {activeTab === 'articles' && (
                    <div className="p-6">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="搜索文章..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">全部分类</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={openCreateArticle}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                新建文章
                            </button>
                        </div>

                        {/* Articles List */}
                        {loading ? (
                            <Loading variant="section" />
                        ) : articles.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>暂无文章</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {article.category_name && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                                        {article.category_name}
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded ${article.is_published
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {article.is_published ? '已发布' : '草稿'}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-800 truncate">{article.title}</h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Eye size={12} />
                                                    {article.views}
                                                </span>
                                                <span>{formatDate(article.updated_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleArticle(article)}
                                                className={`p-2 rounded-lg transition-colors ${article.is_published
                                                        ? 'text-amber-600 hover:bg-amber-100'
                                                        : 'text-green-600 hover:bg-green-100'
                                                    }`}
                                                title={article.is_published ? '取消发布' : '发布'}
                                            >
                                                {article.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => openEditArticle(article)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteArticle(article.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center mt-6 gap-2">
                                <button
                                    onClick={() => fetchArticles(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50"
                                >
                                    上一页
                                </button>
                                <span className="px-4 py-2">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchArticles(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50"
                                >
                                    下一页
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="p-6">
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={openCreateCategory}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                新建分类
                            </button>
                        </div>

                        {categories.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>暂无分类</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cat.icon}</span>
                                            <div>
                                                <h4 className="font-medium text-slate-800">{cat.name}</h4>
                                                <p className="text-sm text-slate-500">{cat.description || '无描述'}</p>
                                                <span className="text-xs text-slate-400">{cat.article_count} 篇文章</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${cat.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {cat.is_active ? '启用' : '禁用'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleCategory(cat)}
                                                className={`p-2 rounded-lg transition-colors ${cat.is_active
                                                        ? 'text-amber-600 hover:bg-amber-100'
                                                        : 'text-green-600 hover:bg-green-100'
                                                    }`}
                                            >
                                                {cat.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => openEditCategory(cat)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingCategory ? '编辑分类' : '新建分类'}
                            </h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">分类名称 *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">图标 (Emoji)</label>
                                <input
                                    type="text"
                                    value={categoryForm.icon}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    maxLength={4}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">排序</label>
                                <input
                                    type="number"
                                    value={categoryForm.sort_order}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium"
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Article Modal */}
            {showArticleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingArticle ? '编辑文章' : '新建文章'}
                            </h3>
                            <button onClick={() => setShowArticleModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveArticle} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">文章标题 *</label>
                                <input
                                    type="text"
                                    value={articleForm.title}
                                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                                <select
                                    value={articleForm.category_id}
                                    onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">未分类</option>
                                    {categories.filter(c => c.is_active).map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">文章内容 *</label>
                                <textarea
                                    value={articleForm.content}
                                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    rows={10}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={articleForm.is_published === 1}
                                    onChange={(e) => setArticleForm({ ...articleForm, is_published: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 text-emerald-500 rounded"
                                />
                                <label htmlFor="is_published" className="text-sm text-slate-700">立即发布</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowArticleModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium"
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
