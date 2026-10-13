import React from 'react';
import { MonthlyReport, Category } from '../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface MonthlyReportViewProps {
  report: MonthlyReport | null;
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (m: number, y: number) => void;
  onOpenSetBudget: () => void;
  onOpenAddExpense: () => void;
  monthName: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  report,
  categories,
  currentMonth,
  currentYear,
  onMonthChange,
  onOpenSetBudget,
  onOpenAddExpense,
  monthName,
}) => {
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const totalSpent = report?.totalSpent ?? 0;
  const prevTotal = report?.prevTotalSpent ?? 0;
  const momDiff = report?.monthDifference ?? 0;
  const momPercent = report?.percentageChange ?? 0;
  const isLower = momDiff <= 0;

  // Calculate total budgeted amount for this month
  const totalBudgeted = (report?.categoryBreakdown || []).reduce(
    (acc, cat) => acc + (cat.budgetLimit || 0),
    0
  );

  const budgetVariance = totalBudgeted > 0 ? totalBudgeted - totalSpent : 0;

  // Maximum daily spend for scaling the daily chart
  const maxDaily = Math.max(
    1,
    ...(report?.dailySpending || []).map((d) => d.amount)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header and Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Financial Reporting</span>
            <span aria-hidden="true">·</span>
            <span>Categorical Aggregation</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Monthly Spending Report: {monthName} {currentYear}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Stepper */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-800 whitespace-nowrap">
              {monthName} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenSetBudget}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Target className="w-4 h-4 text-slate-500" />
            Budget Limits
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1.5">Total Outlay</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            {momDiff !== 0 ? (
              <>
                {isLower ? (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span className={isLower ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                  ${Math.abs(momDiff).toFixed(2)} ({Math.abs(momPercent)}%)
                </span>
                <span className="text-slate-400">vs prior month</span>
              </>
            ) : (
              <span>Prior month: ${prevTotal.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1.5">Average Daily Burn</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
            ${(report?.averageDailySpend || 0).toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {report?.effectiveDays || 1} active days in {monthName}
          </div>
        </div>

        {/* Metric 3: Budget Utilization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1.5">Budget Variance</div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900">
            {totalBudgeted > 0 ? (
              <span className={budgetVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {budgetVariance >= 0 ? `+$${budgetVariance.toFixed(2)}` : `-$${Math.abs(budgetVariance).toFixed(2)}`}
              </span>
            ) : (
              <span className="text-slate-400 text-lg">No budget set</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {totalBudgeted > 0 ? `Target: $${totalBudgeted.toFixed(2)}` : 'Set category limits to track'}
          </div>
        </div>

        {/* Metric 4: Top Outlay */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1.5">Dominant Expense Category</div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {report?.topCategory?.categoryName || 'None'}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-mono-numbers font-medium text-slate-800">
              ${report?.topCategory?.totalAmount.toFixed(2) || '0.00'}
            </span>
            <span className="text-slate-400">
              {report?.topCategory?.percentage || 0}% of monthly spend
            </span>
          </div>
        </div>
      </div>

      {/* Primary Categorical Spending Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Categorical Expenditure Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Detailed distribution by category: Food, Travel, Entertainment, Utilities, etc.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono-numbers">
            {report?.categoryBreakdown?.length || 0} Categories Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium select-none">
                <th className="pb-3 font-medium">Category Name</th>
                <th className="pb-3 font-medium">Transactions</th>
                <th className="pb-3 font-medium">Share of Total</th>
                <th className="pb-3 font-medium">Budget Limit</th>
                <th className="pb-3 font-medium">Utilization</th>
                <th className="pb-3 font-medium text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.categoryBreakdown && report.categoryBreakdown.length > 0 ? (
                report.categoryBreakdown.map((cat) => {
                  const percentOfBudget =
                    cat.budgetLimit > 0
                      ? Math.round((cat.totalAmount / cat.budgetLimit) * 100)
                      : null;

                  return (
                    <tr key={cat.categoryId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.categoryName}</span>
                        </div>
                      </td>

                      <td className="py-3 text-slate-600 font-mono-numbers whitespace-nowrap">
                        {cat.transactionCount} {cat.transactionCount === 1 ? 'entry' : 'entries'}
                      </td>

                      <td className="py-3 text-slate-600 font-mono-numbers whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span>{cat.percentage}%</span>
                        </div>
                      </td>

                      <td className="py-3 text-slate-600 font-mono-numbers whitespace-nowrap">
                        {cat.budgetLimit > 0 ? `$${cat.budgetLimit.toFixed(2)}` : '—'}
                      </td>

                      <td className="py-3 whitespace-nowrap">
                        {cat.budgetLimit > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono-numbers">
                            {cat.isOverBudget ? (
                              <span className="text-rose-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {percentOfBudget}% (Over budget)
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                {percentOfBudget}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={onOpenSetBudget}
                            className="text-[11px] text-indigo-600 hover:underline"
                          >
                            + Set limit
                          </button>
                        )}
                      </td>

                      <td className="py-3 text-right font-mono-numbers font-semibold text-slate-900 whitespace-nowrap">
                        ${cat.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No categorical data available for this month.
                  </td>
                </tr>
              )}
            </tbody>
            {report && report.categoryBreakdown.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold text-slate-900">
                  <td className="pt-3">Total Monthly Spend</td>
                  <td className="pt-3 font-mono-numbers">{report.transactionCount} entries</td>
                  <td className="pt-3 font-mono-numbers">100.0%</td>
                  <td className="pt-3 font-mono-numbers">
                    {totalBudgeted > 0 ? `$${totalBudgeted.toFixed(2)}` : '—'}
                  </td>
                  <td className="pt-3 font-mono-numbers">
                    {totalBudgeted > 0 ? `${Math.round((totalSpent / totalBudgeted) * 100)}%` : '—'}
                  </td>
                  <td className="pt-3 text-right font-mono-numbers font-bold text-slate-900">
                    ${totalSpent.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Daily Spending Distribution for the Selected Month */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Daily Spending Distribution ({monthName} {currentYear})
            </h3>
            <p className="text-xs text-slate-500">
              Day-by-day expenditure timeline across the entire month
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Peak Day: ${maxDaily.toFixed(2)}
          </span>
        </div>

        {report?.dailySpending && report.dailySpending.length > 0 ? (
          <div className="pt-2">
            <div className="h-32 flex items-end gap-1 sm:gap-1.5 overflow-x-auto pb-2">
              {report.dailySpending.map((day) => {
                const heightPct = maxDaily > 0 ? Math.round((day.amount / maxDaily) * 100) : 0;
                return (
                  <div
                    key={day.day}
                    className="flex-1 min-w-[12px] flex flex-col items-center gap-1 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap font-mono z-10 transition-opacity">
                      Day {day.day}: ${day.amount.toFixed(2)}
                    </div>

                    <div
                      className={`w-full rounded-t-xs transition-all duration-200 ${
                        day.amount > 0
                          ? 'bg-indigo-600 group-hover:bg-indigo-700'
                          : 'bg-slate-100 h-1'
                      }`}
                      style={{
                        height: day.amount > 0 ? `${Math.max(8, heightPct)}%` : '4px',
                      }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono-numbers">
                      {day.day % 5 === 0 || day.day === 1 ? day.day : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>Day 1</span>
              <span>Calendar timeline</span>
              <span>Day {report.daysInMonth}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No daily activity recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
};
