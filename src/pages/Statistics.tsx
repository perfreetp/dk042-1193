import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  TrendingUp, Users, Clock, AlertTriangle, FileCheck, Building2,
  BarChart3, PieChart as PieIcon, Activity, Calendar, Download,
  ChevronDown, Zap, Target, Award,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/helpers';

const COLORS = ['#1E3A5F', '#C9A962', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const PIE_COLORS = ['#1E3A5F', '#2E5485', '#3E6EAB', '#C9A962', '#D4B97A'];

export default function Statistics() {
  const {
    contracts, departmentStats, nodeEfficiency, amountDistribution,
  } = useAppStore();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const totalContracts = contracts.length;
  const pendingContracts = contracts.filter((c) => c.status === 'pending').length;
  const archivedContracts = contracts.filter((c) => c.status === 'archived').length;
  const rejectedContracts = contracts.filter((c) => c.status === 'rejected').length;
  const totalAmount = contracts.reduce((s, c) => s + c.amount, 0);
  const avgAmount = totalContracts > 0 ? totalAmount / totalContracts : 0;
  const overallAvgDuration = departmentStats.length > 0
    ? departmentStats.reduce((s, d) => s + d.avgDuration, 0) / departmentStats.length
    : 0;
  const avgRejectionRate = nodeEfficiency.length > 0
    ? nodeEfficiency.reduce((s, n) => s + n.rejectionRate, 0) / nodeEfficiency.length
    : 0;

  const overviewCards = [
    {
      label: '合同总数', value: totalContracts, icon: FileCheck,
      gradient: 'from-indigo-800 to-indigo-600', sub: `总金额 ${formatCurrency(totalAmount)}`,
    },
    {
      label: '审批中', value: pendingContracts, icon: Clock,
      gradient: 'from-amber-500 to-amber-600', sub: `${archivedContracts} 份已归档`,
    },
    {
      label: '平均耗时', value: `${overallAvgDuration.toFixed(1)}天`, icon: Activity,
      gradient: 'from-emerald-600 to-emerald-500', sub: `起草→归档全流程`,
    },
    {
      label: '驳回率', value: `${avgRejectionRate.toFixed(1)}%`, icon: AlertTriangle,
      gradient: 'from-rose-600 to-rose-500', sub: `${rejectedContracts} 份被驳回`,
    },
  ];

  const departmentChartData = departmentStats.map((d) => ({
    name: d.department.length > 4 ? d.department.slice(0, 4) : d.department,
    fullName: d.department,
    合同数量: d.totalContracts,
    完成数量: d.completedCount,
    驳回数量: d.rejectedCount,
    平均耗时: d.avgDuration,
  }));

  const radarData = departmentStats.map((d) => ({
    subject: d.department.length > 4 ? d.department.slice(0, 4) : d.department,
    效率: Math.round((10 - d.avgDuration) * 10),
    完成率: Math.round((d.completedCount / Math.max(1, d.totalContracts)) * 100),
    质量: Math.round((1 - d.rejectedCount / Math.max(1, d.totalContracts)) * 100),
    数量: Math.min(100, Math.round((d.totalContracts / Math.max(...departmentStats.map(x => x.totalContracts))) * 100)),
  }));

  const heatmapData = nodeEfficiency.map((n) => {
    const efficiencyScore = Math.max(0, 100 - n.avgDuration * 15 - n.rejectionRate * 2 - n.timeoutCount);
    let level = 1;
    if (efficiencyScore >= 85) level = 5;
    else if (efficiencyScore >= 70) level = 4;
    else if (efficiencyScore >= 55) level = 3;
    else if (efficiencyScore >= 40) level = 2;
    return {
      ...n,
      level,
      efficiencyScore: Math.max(0, Math.min(100, efficiencyScore)),
    };
  });

  const abnormalNodes = heatmapData
    .filter((n) => n.level <= 2 || n.rejectionRate > 5 || n.timeoutCount > 20)
    .sort((a, b) => b.rejectionRate + b.timeoutCount / 10 - (a.rejectionRate + a.timeoutCount / 10));

  const amountChartData = amountDistribution.map((a) => ({
    name: a.range,
    数量: a.count,
    '金额(万)': Math.round(a.totalAmount / 10000),
  }));

  const timeRangeOptions = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: '90d', label: '近90天' },
    { key: '1y', label: '近1年' },
  ];

  const levelColors: Record<number, string> = {
    5: 'bg-emerald-500',
    4: 'bg-lime-500',
    3: 'bg-yellow-500',
    2: 'bg-orange-500',
    1: 'bg-red-500',
  };

  const levelBgColors: Record<number, string> = {
    5: 'bg-emerald-50 border-emerald-200',
    4: 'bg-lime-50 border-lime-200',
    3: 'bg-yellow-50 border-yellow-200',
    2: 'bg-orange-50 border-orange-200',
    1: 'bg-red-50 border-red-200',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-3 text-xs">
          {label && <p className="font-semibold text-gray-800 mb-1.5 pb-1.5 border-b border-gray-100">{label}</p>}
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="font-semibold text-gray-800">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer
      title="统计分析"
      subtitle="合同全流程数据洞察 · 多维度分析审批效率与质量 · 助力流程优化决策"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeRange(opt.key as typeof timeRange)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === opt.key
                    ? 'bg-white shadow-sm text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="btn-secondary flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {overviewCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="card-base p-5 relative overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gray-100/50" />
                <div className={`absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 tracking-wide">{card.label}</p>
                <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-gray-800">{card.value}</p>
                <p className="mt-2 text-xs text-gray-500">{card.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h3 className="section-title m-0">部门合同统计</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">各部门合同数量、完成情况与平均耗时对比</p>
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend
                    iconType="square"
                    wrapperStyle={{ fontSize: 11, paddingTop: 15 }}
                  />
                  <Bar dataKey="合同数量" fill="#1E3A5F" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="完成数量" fill="#C9A962" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="驳回数量" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-5 card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
                  <PieIcon className="w-4 h-4 text-gold-700" />
                </div>
                <div>
                  <h3 className="section-title m-0">金额分布</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">按合同金额区间统计数量与占比</p>
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={amountChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="数量"
                    label={(entry: any) => `${entry.name} (${entry.数量})`}
                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  >
                    {amountChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-6 card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="section-title m-0">节点效率热力</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">各审批节点平均耗时、超时率与驳回率评估</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-gray-500">效率等级：</span>
                {[5, 4, 3, 2, 1].map((lv) => (
                  <div key={lv} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${levelColors[lv]}`} />
                    <span className="text-gray-600">{lv === 5 ? '优' : lv === 4 ? '良' : lv === 3 ? '中' : lv === 2 ? '差' : '危'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {heatmapData.map((node, idx) => (
                <div
                  key={idx}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${levelBgColors[node.level]} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <p className="text-sm font-semibold text-gray-800">{node.nodeName}</p>
                    <div className={`w-2.5 h-2.5 rounded-full ${levelColors[node.level]}`} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">平均耗时</span>
                      <span className="font-semibold text-gray-700">{node.avgDuration} 天</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">处理数量</span>
                      <span className="font-semibold text-gray-700">{node.totalCount} 件</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">超时/驳回</span>
                      <span className={`font-semibold ${node.timeoutCount > 20 || node.rejectionRate > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                        {node.timeoutCount} / {node.rejectionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-black/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">效率评分</span>
                      <span className="text-[11px] font-bold text-gray-800">{node.efficiencyScore}分</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${levelColors[node.level]}`}
                        style={{ width: `${node.efficiencyScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6 space-y-5">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-violet-700" />
                  </div>
                  <div>
                    <h3 className="section-title m-0">部门综合评估</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">效率、完成率、质量、数量四维雷达评估</p>
                  </div>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Radar name="效率" dataKey="效率" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.4} />
                    <Radar name="完成率" dataKey="完成率" stroke="#C9A962" fill="#C9A962" fillOpacity={0.3} />
                    <Radar name="质量" dataKey="质量" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="section-title m-0">异常节点预警</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">超时率高、驳回率高的节点需重点关注</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200">
                  {abnormalNodes.length} 个待优化
                </span>
              </div>
              <div className="space-y-2">
                {abnormalNodes.length > 0 ? abnormalNodes.map((node, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50/50 to-transparent border border-red-100 hover:border-red-200 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${levelColors[node.level]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-800">{node.nodeName}</span>
                        {node.rejectionRate > 5 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-medium">
                            高驳回率
                          </span>
                        )}
                        {node.timeoutCount > 20 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-medium">
                            超时严重
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span>平均耗时 <b className="text-gray-700">{node.avgDuration}天</b></span>
                        <span>超时 <b className="text-amber-700">{node.timeoutCount}次</b></span>
                        <span>驳回率 <b className="text-red-700">{node.rejectionRate}%</b></span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors shadow-sm">
                      分析原因
                    </button>
                  </div>
                )) : (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                      <Award className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">所有节点运行正常</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">暂未发现异常节点，继续保持</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h3 className="section-title m-0">部门效率排行</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">按平均审批耗时对各部门进行效率排名</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {departmentStats
              .sort((a, b) => a.avgDuration - b.avgDuration)
              .map((dept, idx) => {
                const maxDuration = Math.max(...departmentStats.map((d) => d.avgDuration));
                const progressWidth = ((maxDuration - dept.avgDuration + 1) / (maxDuration + 1)) * 100;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={dept.department}
                    className="relative p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-card transition-all duration-150 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          idx < 3
                            ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {idx < 3 ? medals[idx] : idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{dept.department}</p>
                          <p className="text-[11px] text-gray-500">{dept.totalContracts} 份合同</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif font-bold text-indigo-700">{dept.avgDuration}<span className="text-xs font-normal ml-0.5">天</span></p>
                        <p className="text-[10px] text-gray-500">平均耗时</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          idx < 3 ? 'bg-gradient-to-r from-indigo-600 to-gold-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">完成率</span>
                        <span className="font-semibold text-emerald-700">
                          {Math.round((dept.completedCount / Math.max(1, dept.totalContracts)) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">驳回</span>
                        <span className={`font-semibold ${dept.rejectedCount > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                          {dept.rejectedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
