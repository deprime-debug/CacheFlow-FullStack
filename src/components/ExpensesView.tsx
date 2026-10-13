import React, { useState, useMemo } from 'react';
import { Expense, Category, PaymentMethod } from '../types';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  categories: Category[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  currentMonth: number;
  currentYear: number;
  onMonthChange: (m: number, y: number) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  categories,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  currentMonth,
  currentYear,
  onMonthChange,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered & Sorted expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
          return false;
        }
        if (selectedPaymentMethod !== 'all' && item.paymentMethod !== selectedPaymentMethod) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'date') {
          cmp = new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
        } else if (sortBy === 'amount') {
          cmp = b.amount - a.amount;
        } else if (sortBy === 'title') {
          cmp = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? -cmp : cmp;
      });
  }, [expenses, selectedCategory, selectedPaymentMethod, search, sortBy, sortOrder]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSortToggle = (col: 'date' | 'amount' | 'title') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await onDeleteExpense(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Amount (USD)', 'Category', 'Expense Date', 'Payment Method', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${e.category.name}"`,
      e.expenseDate,
      e.paymentMethod,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendflow_expenses_${currentYear}_${currentMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2026, 2025, 2024];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Expenses Ledger & Transactions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, filter, edit, and organize all categorical expenditure records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month / Year Selectors */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(Number(e.target.value), currentYear)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => onMonthChange(currentMonth, Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer border-l border-slate-200 pl-1.5 ml-1"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search title, merchant, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI / Digital</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Aggregate Summary */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg text-xs">
            <span className="text-slate-500">Filtered Total:</span>
            <span className="font-mono-numbers font-bold text-slate-900">
              ${totalFilteredAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-medium select-none">
                <tr>
                  <th
                    onClick={() => handleSortToggle('title')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Title / Item</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th
                    onClick={() => handleSortToggle('date')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Expense Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th
                    onClick={() => handleSortToggle('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <span>{expense.title}</span>
                        {expense.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: expense.category.color }}
                        />
                        <span>{expense.category.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono-numbers whitespace-nowrap">
                      {expense.expenseDate}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {expense.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-semibold text-slate-900 whitespace-nowrap">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEditExpense(expense)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(expense.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500 space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No expenses matching your criteria</p>
            <p className="text-slate-400">Try clearing filters or record a new expense.</p>
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this expense record? This action will remove it from the database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
