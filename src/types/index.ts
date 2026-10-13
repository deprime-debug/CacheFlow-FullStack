export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  isDefault: boolean;
  userId?: string | null;
  createdAt?: string;
}

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'OTHER';

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  color: string;
  icon: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  budgetLimit: number;
  budgetRemaining: number;
  isOverBudget: boolean;
}

export interface DailySpendingItem {
  day: number;
  date: string;
  amount: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalSpent: number;
  prevTotalSpent: number;
  monthDifference: number;
  percentageChange: number;
  averageDailySpend: number;
  transactionCount: number;
  daysInMonth: number;
  effectiveDays: number;
  topCategory: CategoryBreakdownItem | null;
  largestTransaction: Expense | null;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpending: DailySpendingItem[];
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  monthLabel: string;
  totalSpent: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface TrendsReport {
  trends: MonthlyTrendItem[];
  categories: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface CodeFile {
  filename: string;
  path: string;
  language: string;
  description: string;
  code: string;
}
