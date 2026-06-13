import { useState } from 'react';
import {
  FileText, Download, Eye, Search, Filter, Grid3X3, List,
  Clock, TrendingUp, Star, FolderOpen, ChevronDown, X,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import { CONTRACT_TYPE_CONFIG } from '@/utils/constants';
import { formatFileSize, formatDate } from '@/utils/helpers';
import { ContractType } from '@/types';

const TEMPLATE_CATEGORIES: Array<{ key: 'all' | ContractType; label: string; icon: typeof FileText }> = [
  { key: 'all', label: '全部模板', icon: FolderOpen },
  { key: 'purchase', label: '采购合同', icon: FileText },
  { key: 'sales', label: '销售合同', icon: FileText },
  { key: 'service', label: '服务合同', icon: FileText },
  { key: 'labor', label: '劳动合同', icon: FileText },
  { key: 'other', label: '其他模板', icon: FileText },
];

export default function TemplateCenter() {
  const { templates } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<'all' | ContractType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'usage' | 'updated' | 'name'>('usage');

  const filteredTemplates = templates
    .filter((t) => activeCategory === 'all' || t.type === activeCategory)
    .filter((t) => !searchKeyword || t.name.includes(searchKeyword) || t.description.includes(searchKeyword))
    .sort((a, b) => {
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      if (sortBy === 'updated') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      return a.name.localeCompare(b.name);
    });

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const categoryStats = TEMPLATE_CATEGORIES.slice(1).map((cat) => ({
    ...cat,
    count: templates.filter((t) => t.type === cat.key).length,
  }));

  const selectedTemplate = templates.find((t) => t.id === previewTemplate);

  const categoryColors: Record<string, string> = {
    purchase: 'from-blue-500 to-blue-600',
    sales: 'from-emerald-500 to-emerald-600',
    service: 'from-violet-500 to-violet-600',
    labor: 'from-orange-500 to-orange-600',
    other: 'from-slate-500 to-slate-600',
  };

  return (
    <PageContainer
      title="模板中心"
      subtitle={`${templates.length} 个标准合同模板 · 累计使用 ${totalUsage.toLocaleString()} 次 · 规范合同起草标准`}
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            我的收藏
          </button>
          <button className="btn-primary flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            上传新模板
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-6 gap-3">
          {TEMPLATE_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            const count = cat.key === 'all' ? templates.length : templates.filter((t) => t.type === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`relative p-4 rounded-xl border transition-all duration-150 text-left hover:-translate-y-0.5 animate-fade-in-up ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-card ring-2 ring-indigo-100'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-card'
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${
                  isActive ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-sm font-semibold ${isActive ? 'text-indigo-900' : 'text-gray-800'}`}>{cat.label}</p>
                <p className={`mt-0.5 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>{count} 个模板</p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gold-500 animate-pulse-slow" />
                )}
              </button>
            );
          })}
        </div>

        <div className="card-base p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索模板名称或描述..."
                  className="input-base pl-10 pr-10"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative">
                <button className="btn-secondary flex items-center gap-1.5 min-w-[130px] justify-between">
                  <span className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4" />
                    {sortBy === 'usage' ? '使用次数' : sortBy === 'updated' ? '最近更新' : '名称排序'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filteredTemplates.map((t, idx) => {
              const typeConfig = CONTRACT_TYPE_CONFIG[t.type];
              return (
                <div
                  key={t.id}
                  className="group relative animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="card-base p-0 overflow-hidden hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1">
                    <div className={`relative h-28 bg-gradient-to-br ${categoryColors[t.type]} flex items-center justify-center overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-0 right-0 w-12 h-12 bg-white/90 -translate-y-6 translate-x-6 rotate-45 shadow-lg" />
                      <div className="relative z-10 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-1.5">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[11px] font-medium text-white/90 tracking-wide">版本 {t.version}</p>
                      </div>
                      <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.color}`}>
                        {typeConfig.label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors min-h-[2.5rem]">
                        {t.name}
                      </h4>
                      <p className="mt-1.5 text-[11px] text-gray-500 line-clamp-2 min-h-[1.75rem]">
                        {t.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          {t.usageCount} 次使用
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(t.lastUpdated)}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{formatFileSize(t.fileSize)}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewTemplate(t.id)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-[11px] font-semibold px-2.5">
                            使用
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">模板名称</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">分类</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">版本</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">大小</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">使用次数</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">最近更新</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTemplates.map((t, idx) => {
                  const typeConfig = CONTRACT_TYPE_CONFIG[t.type];
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${categoryColors[t.type]} flex items-center justify-center flex-shrink-0`}>
                            <FileText className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{t.name}</p>
                            <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">{t.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`tag-base ${typeConfig.color}`}>{typeConfig.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{t.version}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{formatFileSize(t.fileSize)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-emerald-700">{t.usageCount}</span>
                        <span className="text-[11px] text-gray-500 ml-1">次</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(t.lastUpdated)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewTemplate(t.id)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
                            使用模板
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTemplates.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">暂无匹配的模板</p>
                <p className="text-xs text-gray-400 mt-1">试试调整筛选条件或搜索关键词</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-5 gap-3">
          {categoryStats.map((cat, idx) => {
            const total = templates.filter((t) => t.type === cat.key).reduce((s, t) => s + t.usageCount, 0);
            return (
              <div key={cat.key} className="card-base p-4 animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryColors[cat.key]} flex items-center justify-center`}>
                    <cat.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{cat.label}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-serif font-bold text-gray-800">{cat.count}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">个模板</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-700">{total.toLocaleString()}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">累计使用</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className={`relative h-40 bg-gradient-to-br ${categoryColors[selectedTemplate.type]} p-6 flex items-end`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/90 -translate-y-10 translate-x-10 rotate-45 shadow-2xl" />
              <button
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative z-10 flex items-end gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 border border-white/30`}>
                      {CONTRACT_TYPE_CONFIG[selectedTemplate.type].label}
                    </span>
                    <span className="text-[11px] text-white/80 font-mono">{selectedTemplate.version}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold">{selectedTemplate.name}</h3>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">文件大小</p>
                  <p className="text-lg font-bold text-gray-800">{formatFileSize(selectedTemplate.fileSize)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">使用次数</p>
                  <p className="text-lg font-bold text-emerald-700">{selectedTemplate.usageCount} 次</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">最近更新</p>
                  <p className="text-lg font-bold text-gray-800">{formatDate(selectedTemplate.lastUpdated)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">文件名称</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{selectedTemplate.fileName}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">模板说明</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-parchment border border-gold-200/50 rounded-xl p-4">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">模板内容预览</h4>
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-inner space-y-4 font-serif">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-wide">{selectedTemplate.name}</h2>
                    <div className="mt-3 w-24 h-0.5 bg-gradient-gold mx-auto" />
                    <p className="mt-2 text-xs text-gray-500">版本号：{selectedTemplate.version}</p>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700 leading-7">
                    <p>
                      <span className="font-bold text-gray-900">甲方（委托方）：</span>
                      ________________________（以下简称"甲方"）
                    </p>
                    <p>
                      <span className="font-bold text-gray-900">乙方（服务方）：</span>
                      ________________________（以下简称"乙方"）
                    </p>
                    <p className="pt-2">
                      根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等、自愿、公平和诚实信用的原则，经友好协商，就________________事宜达成如下协议：
                    </p>
                    <p className="font-bold text-gray-900 pt-2">第一条 合同标的</p>
                    <p className="pl-4">1.1 甲方委托乙方提供________________________服务/货物。</p>
                    <p className="pl-4">1.2 具体内容详见附件一《服务/货物清单》。</p>
                    <p className="font-bold text-gray-900 pt-2">第二条 合同金额</p>
                    <p className="pl-4">2.1 本合同总金额为人民币________________________元（￥________）。</p>
                    <p className="pl-4">2.2 上述金额为含税/不含税价格。</p>
                    <p className="font-bold text-gray-900 pt-2">第三条 付款方式</p>
                    <p className="pl-4">3.1 甲方按以下第________种方式向乙方支付合同款项：</p>
                    <p className="pl-8">（1）一次性付款：________________________；</p>
                    <p className="pl-8">（2）分期付款：________________________。</p>
                    <p className="font-bold text-gray-900 pt-2">第四条 履行期限</p>
                    <p className="pl-4">4.1 本合同履行期限自________年____月____日起至________年____月____日止。</p>
                    <p className="pt-4 text-gray-400 italic text-center">—— 以下为更多标准条款 ——</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-500">模板已通过法务合规审核 · 标准条款可直接使用</p>
              <div className="flex items-center gap-2.5">
                <button className="btn-secondary flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  下载模板
                </button>
                <button className="btn-primary flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  使用此模板起草
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
