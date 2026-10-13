import React from 'react';
import { Expense, MonthlyReport } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Target,
  Sparkles,
} from 'lucide-react';

interface DashboardOverviewProps {
  report: MonthlyReport | null;
  recentExpenses: Expense[];
  onOpenAddExpense: () => void;
  onOpenSetBudget: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToMonthly: () => void;
  onNavigateToTrends: () => void;
  monthName: string;
  year: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  report,
  recentExpenses,
  onOpenAddExpense,
  onOpenSetBudget,
  onNavigateToExpenses,
  onNavigateToMonthly,
  onNavigateToTrends,
  monthName,
  year,
}) => {
  const totalSpent = report?.totalSpent ?? 0;
  const avgDaily = report?.averageDailySpend ?? 0;
  const percentageChange = report?.percentageChange ?? 0;
  const topCategory = report?.topCategory;

  const isSpendLower = percentageChange <= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Accounting Ledger</span>
            <span aria-hidden="true">·</span>
            <span>{monthName} {year}</span>
            <span aria-hidden="true">·</span>
            <span>Active Session</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Health & Expenditure Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSetBudget}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Target className="w-4 h-4 text-slate-500" />
            Set Budget Limits
          </button>
          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Month Spend</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {percentageChange !== 0 ? (
              <>
                {isSpendLower ? (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span className={isSpendLower ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                  {Math.abs(percentageChange)}% {isSpendLower ? 'decrease' : 'increase'}
                </span>
                <span className="text-slate-400">vs last month</span>
              </>
            ) : (
              <span className="text-slate-400">Baseline month spend</span>
            )}
          </div>
        </div>

        {/* Card 2: Daily Average */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Daily Average</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
            ${avgDaily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {report?.effectiveDays || 1} tracked calendar days
          </div>
        </div>

        {/* Card 3: Top Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Top Category</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {topCategory?.categoryName || 'No expenses yet'}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono-numbers font-medium text-slate-700">
              ${topCategory?.totalAmount ? topCategory.totalAmount.toFixed(2) : '0.00'}
            </span>
            <span className="text-slate-400">
              {topCategory?.percentage ? `${topCategory.percentage}% of total` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 4: Total Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Logged Transactions</span>
            <span className="text-xs font-mono text-slate-400">COUNT</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
            {report?.transactionCount || 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Stored in MySQL relational records
          </div>
        </div>
      </div>

      {/* Main Split: Category Breakdown Progress + Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3): Category Breakdown Progress */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly Spending by Category
              </h3>
              <button
                onClick={onNavigateToMonthly}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View Report <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {report?.categoryBreakdown && report.categoryBreakdown.length > 0 ? (
                report.categoryBreakdown.slice(0, 5).map((cat) => {
                  const percentOfBudget =
                    cat.budgetLimit > 0
                      ? Math.min(100, Math.round((cat.totalAmount / cat.budgetLimit) * 100))
                      : 0;

                  return (
                    <div key={cat.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{cat.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-semibold text-slate-900">
                            ${cat.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-slate-400">({cat.percentage}%)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, cat.percentage)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>

                      {cat.budgetLimit > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>Budget: ${cat.budgetLimit}</span>
                          <span
                            className={
                              cat.isOverBudget
                                ? 'text-rose-600 font-medium'
                                : 'text-slate-500'
                            }
                          >
                            {cat.isOverBudget
                              ? `Over by $${(cat.totalAmount - cat.budgetLimit).toFixed(2)}`
                              : `${percentOfBudget}% utilized`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No category expenses logged for this month.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={onNavigateToTrends}
              className="w-full py-2 px-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              Analyze Multi-Month Trend Charts
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (2/3): Recent Ledger Entries */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent Expense Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Latest recorded purchases and transactions
                </p>
              </div>
              <button
                onClick={onNavigateToExpenses}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                All Expenses ({recentExpenses.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2 font-medium">Item / Merchant</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Method</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentExpenses.slice(0, 6).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900 max-w-[200px] truncate">
                          {item.title}
                          {item.notes && (
                            <span className="block text-[11px] text-slate-400 truncate">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-slate-600 whitespace-nowrap">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: item.category.color }}
                          />
                          {item.category.name}
                        </td>
                        <td className="py-2.5 text-slate-500 font-mono-numbers whitespace-nowrap">
                          {item.expenseDate}
                        </td>
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">
                          {item.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 text-right font-mono-numbers font-semibold text-slate-900 whitespace-nowrap">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                <p>No expense records found yet.</p>
                <button
                  onClick={onOpenAddExpense}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log First Expense
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified with JWT Session Token</span>
            <span className="font-mono">REST: /api/expenses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
