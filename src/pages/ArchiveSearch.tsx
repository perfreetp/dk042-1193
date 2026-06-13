import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Archive, FileText, Calendar, DollarSign,
  Building2, ChevronDown, X, Eye, Download, ArrowRight,
  SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import {
  CONTRACT_TYPE_CONFIG, STATUS_CONFIG, DEPARTMENTS,
} from '@/utils/constants';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/helpers';
import { ContractType, Contract } from '@/types';

export default function ArchiveSearch() {
  const navigate = useNavigate();
  const { contracts } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [filters, setFilters] = useState({
    type: '' as '' | ContractType,
    department: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });

  const archivedContracts = contracts.filter((c) => c.status === 'archived');

  const filteredContracts = archivedContracts
    .filter((c) => {
      if (searchKeyword && !c.code.includes(searchKeyword) && !c.name.includes(searchKeyword)) return false;
      if (filters.type && c.type !== filters.type) return false;
      if (filters.department && c.department !== filters.department) return false;
      if (filters.dateFrom && new Date(c.actualArchiveTime!) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(c.actualArchiveTime!) > new Date(filters.dateTo + 'T23:59:59')) return false;
      if (filters.amountMin && c.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && c.amount > parseFloat(filters.amountMax)) return false;
      return true;
    });

  const totalAmount = filteredContracts.reduce((sum, c) => sum + c.amount, 0);
  const avgDuration = filteredContracts.length > 0
    ? filteredContracts.reduce((s, c) => {
        const days = (new Date(c.actualArchiveTime!).getTime() - new Date(c.createTime).getTime()) / (24 * 60 * 60 * 1000);
        return s + days;
      }, 0) / filteredContracts.length
    : 0;

  const resetFilters = () => {
    setFilters({ type: '', department: '', dateFrom: '', dateTo: '', amountMin: '', amountMax: '' });
    setSearchKeyword('');
  };

  const getContractTypeColor = (type: ContractType) => {
    const colors: Record<ContractType, string> = {
      purchase: 'from-blue-500 to-blue-600',
      sales: 'from-emerald-500 to-emerald-600',
      service: 'from-violet-500 to-violet-600',
      labor: 'from-orange-500 to-orange-600',
      other: 'from-slate-500 to-slate-600',
    };
    return colors[type];
  };

  return (
    <PageContainer
      title="归档查询"
      subtitle={`合同档案库 · 共 ${archivedContracts.length} 份已归档合同 · 累计金额 ${formatCurrency(archivedContracts.reduce((s, c) => s + c.amount, 0))}`}
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            导出清单
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAdvanced ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <div className="card-base p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-100/60" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600">归档合同</p>
              </div>
              <p className="text-3xl font-serif font-bold text-gray-800">{filteredContracts.length}</p>
              <p className="text-xs text-gray-500 mt-1">符合筛选条件</p>
            </div>
          </div>
          <div className="card-base p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gold-100/60" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600">累计金额</p>
              </div>
              <p className="text-3xl font-serif font-bold text-gray-800">¥{(totalAmount / 10000).toFixed(1)}<span className="text-base font-normal ml-0.5">万</span></p>
              <p className="text-xs text-gray-500 mt-1">合同总金额</p>
            </div>
          </div>
          <div className="card-base p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-100/60" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600">平均周期</p>
              </div>
              <p className="text-3xl font-serif font-bold text-gray-800">{avgDuration.toFixed(1)}<span className="text-base font-normal ml-0.5">天</span></p>
              <p className="text-xs text-gray-500 mt-1">起草到归档</p>
            </div>
          </div>
          <div className="card-base p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-violet-100/60" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600">涉及部门</p>
              </div>
              <p className="text-3xl font-serif font-bold text-gray-800">{new Set(filteredContracts.map((c) => c.department)).size}</p>
              <p className="text-xs text-gray-500 mt-1">个部门参与</p>
            </div>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[320px] max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入合同编号或合同名称进行搜索..."
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
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as '' | ContractType })}
              className="input-base w-[140px]"
            >
              <option value="">全部类型</option>
              {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="input-base w-[140px]"
            >
              <option value="">全部部门</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              className="btn-secondary flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
            <button className="btn-primary flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              查询
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-6 gap-3 animate-fade-in-up">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">归档日期（起）</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">归档日期（止）</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">最低金额（元）</label>
                <input
                  type="number"
                  value={filters.amountMin}
                  onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                  placeholder="请输入"
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">最高金额（元）</label>
                <input
                  type="number"
                  value={filters.amountMax}
                  onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                  placeholder="请输入"
                  className="input-base text-sm"
                />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                  <Filter className="w-4 h-4" />
                  更多条件
                </button>
                <button className="btn-secondary flex items-center justify-center gap-1.5 px-4">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">查询结果</p>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {filteredContracts.length} 条
              </span>
            </div>
            <p className="text-xs text-gray-500">
              已筛选 · 共 {filteredContracts.length} 份合同 · 总金额 {formatCurrency(totalAmount)}
            </p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">合同信息</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">类型</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">金额</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">部门</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">申请人</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">创建日期</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">归档日期</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">状态</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-600 tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((c, idx) => {
                const typeConfig = CONTRACT_TYPE_CONFIG[c.type];
                const statusConfig = STATUS_CONFIG[c.status];
                const duration = Math.ceil(
                  (new Date(c.actualArchiveTime!).getTime() - new Date(c.createTime).getTime()) / (24 * 60 * 60 * 1000)
                );
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-indigo-50/30 transition-colors animate-fade-in-up cursor-pointer group"
                    style={{ animationDelay: `${idx * 30}ms` }}
                    onClick={() => setSelectedContract(c)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getContractTypeColor(c.type)} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-indigo-700 font-semibold">{c.code}</p>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[280px] mt-0.5">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`tag-base ${typeConfig.color}`}>{typeConfig.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(c.amount)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{c.department}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-700">{c.applicantName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{formatDate(c.createTime)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="text-sm text-gray-700 font-medium">{formatDate(c.actualArchiveTime!)}</span>
                        <p className="text-[11px] text-emerald-600 mt-0.5">耗时 {duration} 天</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`tag-base ${statusConfig.color}`}>{statusConfig.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContract(c);
                          }}
                          className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/approval/${c.id}`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-100 text-gray-500 hover:text-violet-600 transition-colors"
                          title="查看流程"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 transition-colors"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredContracts.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Archive className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-700">暂无符合条件的归档合同</p>
              <p className="text-xs text-gray-500 mt-1.5">请尝试调整筛选条件或清空搜索关键词</p>
              <button onClick={resetFilters} className="mt-4 btn-secondary">
                清空筛选条件
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="relative px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-gold-50/50">
              <button
                onClick={() => setSelectedContract(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getContractTypeColor(selectedContract.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      {selectedContract.code}
                    </span>
                    <span className={`tag-base ${CONTRACT_TYPE_CONFIG[selectedContract.type].color}`}>
                      {CONTRACT_TYPE_CONFIG[selectedContract.type].label}
                    </span>
                    <span className={`tag-base ${STATUS_CONFIG[selectedContract.status].color}`}>
                      {STATUS_CONFIG[selectedContract.status].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900">{selectedContract.name}</h3>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">合同金额</p>
                  <p className="text-2xl font-serif font-bold text-indigo-700">{formatCurrency(selectedContract.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">所属部门</p>
                  <p className="text-lg font-bold text-gray-800">{selectedContract.department}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">申请人：{selectedContract.applicantName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[11px] text-gray-500 mb-1">审批周期</p>
                  <p className="text-2xl font-serif font-bold text-emerald-700">
                    {Math.ceil(
                      (new Date(selectedContract.actualArchiveTime!).getTime() - new Date(selectedContract.createTime).getTime()) / (24 * 60 * 60 * 1000)
                    )}
                    <span className="text-sm font-normal ml-1">天</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    时间信息
                  </h4>
                  <div className="bg-parchment border border-gold-200/50 rounded-xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">创建时间</span>
                      <span className="font-medium text-gray-800">{formatDateTime(selectedContract.createTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">预计归档</span>
                      <span className="font-medium text-gray-800">{formatDate(selectedContract.expectedArchiveTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">实际归档</span>
                      <span className="font-medium text-emerald-700">{formatDateTime(selectedContract.actualArchiveTime!)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    归档附件
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
                    {selectedContract.attachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{a.name}</p>
                            <p className="text-[10px] text-gray-500">{a.uploader} · {formatDate(a.uploadTime)}</p>
                          </div>
                        </div>
                        <button className="p-1.5 rounded-md hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-indigo-600" />
                  审批流程回顾
                </h4>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="relative">
                    {selectedContract.approvalHistory.map((record, idx) => (
                      <div key={idx} className="relative flex gap-4 pb-5 last:pb-0">
                        {idx < selectedContract.approvalHistory.length - 1 && (
                          <div className="absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-10px)] bg-gradient-to-b from-emerald-400 to-emerald-200" />
                        )}
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 z-10">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{record.nodeName}</span>
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                              {record.action === 'approve' ? '同意' : record.action === 'reject' ? '驳回' : '加签'}
                            </span>
                            <span className="text-[11px] text-gray-500">{record.approverName}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(record.time)}</p>
                          {record.opinion && (
                            <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                              {record.opinion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                档案编号：ARC-{selectedContract.code} · 已存入合同档案库，可随时调阅
              </p>
              <div className="flex items-center gap-2.5">
                <button className="btn-secondary flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  下载档案
                </button>
                <button
                  onClick={() => {
                    navigate(`/approval/${selectedContract.id}`);
                    setSelectedContract(null);
                  }}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  查看完整流程
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
