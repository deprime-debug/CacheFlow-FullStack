import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardOverview } from './components/DashboardOverview';
import { ExpensesView } from './components/ExpensesView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { DataVisualizationView } from './components/DataVisualizationView';
import { SpringBootDocsView } from './components/SpringBootDocsView';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';
import { Category, Expense, MonthlyReport, TrendsReport } from './types';
import { api } from './services/api';
import { ShieldCheck, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [trendsReport, setTrendsReport] = useState<TrendsReport | null>(null);

  // Month & Year state (defaults to current month and year)
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentMonth - 1] || 'Current Month';

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Load Expenses & Reports
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [expList, report, trends] = await Promise.all([
        api.getExpenses({ month: currentMonth, year: currentYear }),
        api.getMonthlyReport(currentMonth, currentYear),
        api.getTrendsReport(6),
      ]);
      setExpenses(expList);
      setMonthlyReport(report);
      setTrendsReport(trends);
    } catch (err) {
      console.error('Failed to load expense data:', err);
    }
  }, [isAuthenticated, currentMonth, currentYear]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
      refreshData();
    }
  }, [isAuthenticated, currentMonth, currentYear, loadCategories, refreshData]);

  // Handlers
  const handleOpenAddExpense = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (data: {
    title: string;
    amount: number;
    categoryId: string;
    expenseDate: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, data);
      showToast('Expense updated successfully.');
    } else {
      await api.createExpense(data);
      showToast('Expense recorded successfully.');
    }
    await refreshData();
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    showToast('Expense deleted.');
    await refreshData();
  };

  const handleSaveBudget = async (categoryId: string, limit: number) => {
    await api.setBudget({
      categoryId,
      monthlyLimit: limit,
      month: currentMonth,
      year: currentYear,
    });
    showToast('Category budget target saved.');
    await refreshData();
  };

  const handleMonthChange = (m: number, y: number) => {
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Initializing SpendFlow session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="py-8 space-y-8 max-w-xl mx-auto">
            {/* Unauthenticated Landing / Auth Screen */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                SpendFlow Expense Tracker
              </h1>
              <p className="text-sm text-slate-600">
                Enterprise JWT Authentication · MySQL Relational Schema · Spring Boot REST API
              </p>
            </div>

            <AuthModal
              onSuccess={() => {
                setIsAuthModalOpen(false);
                showToast('Welcome back!');
              }}
            />

            <div className="text-center">
              <button
                onClick={() => setActiveTab('springboot')}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
              >
                Inspect Spring Boot & MySQL Java Architecture Code
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && (
              <DashboardOverview
                report={monthlyReport}
                recentExpenses={expenses}
                onOpenAddExpense={handleOpenAddExpense}
                onOpenSetBudget={() => setIsBudgetModalOpen(true)}
                onNavigateToExpenses={() => setActiveTab('expenses')}
                onNavigateToMonthly={() => setActiveTab('monthly')}
                onNavigateToTrends={() => setActiveTab('trends')}
                monthName={monthName}
                year={currentYear}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                expenses={expenses}
                categories={categories}
                onOpenAddExpense={handleOpenAddExpense}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={handleMonthChange}
              />
            )}

            {activeTab === 'monthly' && (
              <MonthlyReportView
                report={monthlyReport}
                categories={categories}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={handleMonthChange}
                onOpenSetBudget={() => setIsBudgetModalOpen(true)}
                onOpenAddExpense={handleOpenAddExpense}
                monthName={monthName}
              />
            )}

            {activeTab === 'trends' && (
              <DataVisualizationView
                trendsReport={trendsReport}
                monthlyReport={monthlyReport}
                currentMonth={currentMonth}
                currentYear={currentYear}
                monthName={monthName}
              />
            )}

            {activeTab === 'springboot' && <SpringBootDocsView />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SpendFlow</span>
            <span>· Full Stack Expense Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('springboot')}
              className="hover:text-slate-900 transition-colors"
            >
              Spring Boot REST API
            </button>
            <button
              onClick={() => setActiveTab('springboot')}
              className="hover:text-slate-900 transition-colors"
            >
              MySQL Schema
            </button>
            <span>JWT Bearer Security</span>
          </div>
        </div>
      </footer>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        categories={categories}
        initialData={editingExpense}
      />

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onSaveBudget={handleSaveBudget}
      />

      {/* Quick Auth Modal (if user opens sign-in while exploring) */}
      {isAuthModalOpen && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-xs hover:underline"
            >
              Close
            </button>
            <AuthModal
              onSuccess={() => {
                setIsAuthModalOpen(false);
                showToast('Signed in successfully.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
