import React, { useState, useMemo } from 'react';
import { TrendsReport, MonthlyReport } from '../types';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';

interface DataVisualizationViewProps {
  trendsReport: TrendsReport | null;
  monthlyReport: MonthlyReport | null;
  currentMonth: number;
  currentYear: number;
  monthName: string;
}

export const DataVisualizationView: React.FC<DataVisualizationViewProps> = ({
  trendsReport,
  monthlyReport,
  currentMonth,
  currentYear,
  monthName,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);
  const [hoveredCategorySlice, setHoveredCategorySlice] = useState<string | null>(null);

  const trends = trendsReport?.trends || [];
  const categories = trendsReport?.categories || [];

  // Trend line math
  const maxSpend = useMemo(() => {
    if (!trends.length) return 100;
    const values = trends.map((t) => t.totalSpent);
    return Math.max(...values, 100);
  }, [trends]);

  const minSpend = useMemo(() => {
    if (!trends.length) return 0;
    const values = trends.map((t) => t.totalSpent);
    return Math.min(...values, 0);
  }, [trends]);

  const avgSpend = useMemo(() => {
    if (!trends.length) return 0;
    const sum = trends.reduce((acc, t) => acc + t.totalSpent, 0);
    return sum / trends.length;
  }, [trends]);

  // SVG dimensions for Trend Chart
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Compute SVG Points for Trend Line
  const points = useMemo(() => {
    if (trends.length < 2) return [];
    const span = maxSpend - minSpend || 1;
    return trends.map((item, idx) => {
      const x = paddingX + (idx / (trends.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - ((item.totalSpent - minSpend) / span) * chartHeight;
      return { x, y, item, idx };
    });
  }, [trends, maxSpend, minSpend, chartWidth, chartHeight]);

  const linePathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  const areaPathD = useMemo(() => {
    if (points.length < 2) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = paddingY + chartHeight;
    return `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePathD, points, paddingY, chartHeight]);

  // Donut chart math for current month's category breakdown
  const categoryBreakdown = monthlyReport?.categoryBreakdown || [];
  const totalMonthSpent = monthlyReport?.totalSpent || 0;

  const donutSlices = useMemo(() => {
    if (!categoryBreakdown.length || totalMonthSpent <= 0) return [];

    let currentAngle = 0;
    const radius = 80;
    const center = 100;
    const innerRadius = 52;

    return categoryBreakdown
      .filter((cat) => cat.totalAmount > 0)
      .map((cat) => {
        const sliceAngle = (cat.totalAmount / totalMonthSpent) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle += sliceAngle;

        // Radians
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const x3 = center + innerRadius * Math.cos(endRad);
        const y3 = center + innerRadius * Math.sin(endRad);
        const x4 = center + innerRadius * Math.cos(startRad);
        const y4 = center + innerRadius * Math.sin(startRad);

        const largeArc = sliceAngle > 180 ? 1 : 0;

        const pathData = `
          M ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `;

        return {
          cat,
          pathData,
          startAngle,
          endAngle,
          percentage: cat.percentage,
        };
      });
  }, [categoryBreakdown, totalMonthSpent]);

  // Max value for monthly category comparison
  const maxCatMonthly = useMemo(() => {
    if (!trends.length) return 500;
    let max = 0;
    trends.forEach((t) => {
      Object.values(t.categoryBreakdown).forEach((val) => {
        if (val > max) max = val;
      });
    });
    return Math.max(max, 100);
  }, [trends]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Visual Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Historical Spending Velocity</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Monthly Expenditure Trend Visualizations
          </h1>
        </div>

        {/* Visual Legend / Context */}
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono-numbers">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Monthly Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 border-t border-dashed border-slate-400" />
            <span>Avg Spend (${avgSpend.toFixed(0)})</span>
          </div>
        </div>
      </div>

      {/* Primary Chart: Monthly Spend Trend Line & Area SVG Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Expenditure Velocity & Monthly Trajectory
            </h2>
            <p className="text-xs text-slate-500">
              Multi-month aggregate spend trend line with hover data inspections
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-numbers">
            <span className="text-slate-500">Peak Month:</span>
            <span className="font-bold text-slate-900">${maxSpend.toFixed(2)}</span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg p-2 border border-slate-100">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + chartHeight * ratio;
              const val = maxSpend - ratio * (maxSpend - minSpend);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    ${val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Average horizontal line */}
            {avgSpend > 0 && (
              <line
                x1={paddingX}
                y1={paddingY + chartHeight - ((avgSpend - minSpend) / (maxSpend - minSpend || 1)) * chartHeight}
                x2={svgWidth - paddingX}
                y2={paddingY + chartHeight - ((avgSpend - minSpend) / (maxSpend - minSpend || 1)) * chartHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Area Fill */}
            {areaPathD && <path d={areaPathD} fill="url(#areaGradient)" />}

            {/* Line Path */}
            {linePathD && (
              <path
                d={linePathD}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {points.map((pt) => {
              const isHovered = hoveredPointIndex === pt.idx;
              return (
                <g key={pt.idx}>
                  {/* Outer ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#ffffff"
                    stroke="#4f46e5"
                    strokeWidth={isHovered ? 3 : 2}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPointIndex(pt.idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />

                  {/* X-axis Month Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={`text-[11px] font-mono select-none ${
                      isHovered ? 'fill-indigo-600 font-bold' : 'fill-slate-500'
                    }`}
                  >
                    {pt.item.monthLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Float Tooltip */}
          {hoveredPointIndex !== null && points[hoveredPointIndex] && (
            <div
              className="absolute pointer-events-none bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg z-20 font-mono-numbers transition-all duration-75"
              style={{
                left: `${(points[hoveredPointIndex].x / svgWidth) * 100}%`,
                top: `${(points[hoveredPointIndex].y / svgHeight) * 100}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="font-semibold text-indigo-300">
                {points[hoveredPointIndex].item.monthLabel}
              </div>
              <div className="text-white text-sm font-bold">
                ${points[hoveredPointIndex].item.totalSpent.toFixed(2)}
              </div>
              <div className="text-slate-400 text-[11px]">
                {points[hoveredPointIndex].item.transactionCount} transactions recorded
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Category Comparison Bar Chart + Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Monthly Comparison (Food vs Travel vs Entertainment over months) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Category Monthly Trend Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Track individual spending shifts in Food, Travel & Entertainment
                </p>
              </div>

              {/* Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
              >
                <option value="all">All Top Categories</option>
                <option value="food">Food & Dining</option>
                <option value="travel">Travel & Transport</option>
                <option value="entertainment">Entertainment & Leisure</option>
                <option value="utilities">Utilities & Bills</option>
              </select>
            </div>

            {/* Bar chart rendering */}
            <div className="space-y-4 pt-2">
              {trends.map((t) => {
                const foodVal = t.categoryBreakdown['food'] || 0;
                const travelVal = t.categoryBreakdown['travel'] || 0;
                const entVal = t.categoryBreakdown['entertainment'] || 0;
                const utilVal = t.categoryBreakdown['utilities'] || 0;

                return (
                  <div key={t.monthLabel} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{t.monthLabel}</span>
                      <span className="font-mono-numbers font-medium text-slate-900">
                        ${t.totalSpent.toFixed(2)}
                      </span>
                    </div>

                    {/* Sub bars */}
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      {(selectedCategoryFilter === 'all' || selectedCategoryFilter === 'food') && (
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-slate-500 truncate">Food</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (foodVal / maxCatMonthly) * 100)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono-numbers text-slate-700">
                            ${foodVal.toFixed(0)}
                          </span>
                        </div>
                      )}

                      {(selectedCategoryFilter === 'all' || selectedCategoryFilter === 'travel') && (
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-slate-500 truncate">Travel</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (travelVal / maxCatMonthly) * 100)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono-numbers text-slate-700">
                            ${travelVal.toFixed(0)}
                          </span>
                        </div>
                      )}

                      {(selectedCategoryFilter === 'all' || selectedCategoryFilter === 'entertainment') && (
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-slate-500 truncate">Ent.</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (entVal / maxCatMonthly) * 100)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono-numbers text-slate-700">
                            ${entVal.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Food
              <span className="w-2 h-2 rounded-full bg-sky-500 ml-2" /> Travel
              <span className="w-2 h-2 rounded-full bg-purple-500 ml-2" /> Entertainment
            </span>
            <span>Historical Breakdown</span>
          </div>
        </div>

        {/* Right: Donut Chart Distribution for Current Month */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  Category Outlay Share ({monthName})
                </h3>
                <p className="text-xs text-slate-500">
                  Proportional share of monthly capital distribution
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900">
                ${totalMonthSpent.toFixed(2)}
              </span>
            </div>

            {donutSlices.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
                {/* SVG Donut */}
                <div className="relative w-44 h-44 shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {donutSlices.map((slice) => {
                      const isHovered = hoveredCategorySlice === slice.cat.categoryId;
                      return (
                        <path
                          key={slice.cat.categoryId}
                          d={slice.pathData}
                          fill={slice.cat.color}
                          className="transition-opacity duration-150 cursor-pointer"
                          opacity={hoveredCategorySlice && !isHovered ? 0.35 : 1}
                          onMouseEnter={() => setHoveredCategorySlice(slice.cat.categoryId)}
                          onMouseLeave={() => setHoveredCategorySlice(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 font-medium">Monthly Total</span>
                    <span className="text-sm font-bold font-mono-numbers text-slate-900">
                      ${totalMonthSpent.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1.5 w-full text-xs">
                  {donutSlices.map((slice) => (
                    <div
                      key={slice.cat.categoryId}
                      onMouseEnter={() => setHoveredCategorySlice(slice.cat.categoryId)}
                      onMouseLeave={() => setHoveredCategorySlice(null)}
                      className={`flex items-center justify-between p-1 rounded transition-colors cursor-pointer ${
                        hoveredCategorySlice === slice.cat.categoryId ? 'bg-slate-100 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.cat.color }}
                        />
                        <span className="truncate text-slate-800">{slice.cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono-numbers text-slate-600">
                        <span>${slice.cat.totalAmount.toFixed(2)}</span>
                        <span className="text-slate-400">({slice.cat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No expense categories logged for this month yet.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Hover segments for detailed category contribution</span>
            <span className="font-mono">SVG Geometry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
