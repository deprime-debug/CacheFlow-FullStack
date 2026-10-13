import { Response } from 'express';
import { db, PaymentMethod } from '../db/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export function getExpenses(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { month, year, categoryId, search, sortBy, order } = req.query;

    const filter: any = {};
    if (month && !isNaN(Number(month))) filter.month = Number(month);
    if (year && !isNaN(Number(year))) filter.year = Number(year);
    if (categoryId && typeof categoryId === 'string') filter.categoryId = categoryId;
    if (search && typeof search === 'string') filter.search = search;
    if (sortBy && typeof sortBy === 'string') filter.sortBy = sortBy as any;
    if (order && (order === 'asc' || order === 'desc')) filter.order = order;

    const expenses = db.getExpenses(userId, filter);

    res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length,
    });
  } catch (err: any) {
    console.error('getExpenses error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
}

export function createExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, amount, categoryId, expenseDate, paymentMethod, notes } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'Expense title is required.' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Category is required.' });
      return;
    }

    const category = db.findCategoryById(categoryId);
    if (!category) {
      res.status(400).json({ success: false, message: 'Selected category does not exist.' });
      return;
    }

    const dateStr = expenseDate || new Date().toISOString().split('T')[0];
    const validPaymentMethods: PaymentMethod[] = [
      'CREDIT_CARD',
      'DEBIT_CARD',
      'CASH',
      'BANK_TRANSFER',
      'UPI',
      'OTHER',
    ];
    const method: PaymentMethod = validPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : 'CREDIT_CARD';

    const newExpense = db.createExpense({
      userId,
      categoryId,
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      expenseDate: dateStr,
      paymentMethod: method,
      notes: notes ? notes.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      data: {
        ...newExpense,
        category,
      },
    });
  } catch (err: any) {
    console.error('createExpense error:', err);
    res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
}

export function updateExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, amount, categoryId, expenseDate, paymentMethod, notes } = req.body;

    const existing = db.findExpenseById(id);
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    const updates: any = {};
    if (title && typeof title === 'string') updates.title = title.trim();
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
        return;
      }
      updates.amount = Math.round(numAmount * 100) / 100;
    }
    if (categoryId) {
      const cat = db.findCategoryById(categoryId);
      if (!cat) {
        res.status(400).json({ success: false, message: 'Invalid category.' });
        return;
      }
      updates.categoryId = categoryId;
    }
    if (expenseDate) updates.expenseDate = expenseDate;
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (notes !== undefined) updates.notes = notes ? notes.trim() : '';

    const updated = db.updateExpense(id, userId, updates);
    const category = db.findCategoryById(updated!.categoryId);

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: {
        ...updated,
        category,
      },
    });
  } catch (err: any) {
    console.error('updateExpense error:', err);
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
}

export function deleteExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = db.deleteExpense(id, userId);
    if (!success) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (err: any) {
    console.error('deleteExpense error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
}

export function getCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const categories = db.getCategories(userId);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err: any) {
    console.error('getCategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to get categories.' });
  }
}

export function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, color, icon, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const newCat = db.createCategory(
      userId,
      name.trim(),
      color || '#6366f1',
      icon || 'Tag',
      description ? description.trim() : ''
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCat,
    });
  } catch (err: any) {
    console.error('createCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
}

export function getMonthlyReport(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    // Fetch expenses for current month
    const expenses = db.getExpenses(userId, { month, year });

    // Also fetch previous month for MoM comparison
    const prevDate = new Date(year, month - 2, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();
    const prevExpenses = db.getExpenses(userId, { month: prevMonth, year: prevYear });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotalSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

    const monthDifference = totalSpent - prevTotalSpent;
    const percentageChange =
      prevTotalSpent > 0 ? ((monthDifference / prevTotalSpent) * 100) : 0;

    // Days in current month
    const daysInMonth = new Date(year, month, 0).getDate();
    // If viewing current calendar month, use days elapsed so far, otherwise whole month
    const isCurrentCalendarMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;
    const effectiveDays = isCurrentCalendarMonth ? Math.max(1, now.getDate()) : daysInMonth;
    const averageDailySpend = totalSpent / effectiveDays;

    // Category breakdown
    const categories = db.getCategories(userId);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const budgets = db.getBudgets(userId, month, year);
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.monthlyLimit]));

    const categoryMap: Record<
      string,
      {
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
    > = {};

    categories.forEach((cat) => {
      const budgetLimit = budgetMap.get(cat.id) || 0;
      categoryMap[cat.id] = {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        color: cat.color,
        icon: cat.icon,
        totalAmount: 0,
        transactionCount: 0,
        percentage: 0,
        budgetLimit,
        budgetRemaining: budgetLimit,
        isOverBudget: false,
      };
    });

    expenses.forEach((e) => {
      const entry = categoryMap[e.categoryId];
      if (entry) {
        entry.totalAmount += e.amount;
        entry.transactionCount += 1;
      } else {
        const cat = catMap.get(e.categoryId);
        categoryMap[e.categoryId] = {
          categoryId: e.categoryId,
          categoryName: cat?.name || 'Other',
          categorySlug: cat?.slug || 'other',
          color: cat?.color || '#64748b',
          icon: cat?.icon || 'Tag',
          totalAmount: e.amount,
          transactionCount: 1,
          percentage: 0,
          budgetLimit: 0,
          budgetRemaining: 0,
          isOverBudget: false,
        };
      }
    });

    const categoryBreakdown = Object.values(categoryMap)
      .map((item) => {
        const percentage = totalSpent > 0 ? (item.totalAmount / totalSpent) * 100 : 0;
        const budgetRemaining = item.budgetLimit > 0 ? item.budgetLimit - item.totalAmount : 0;
        return {
          ...item,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
          percentage: Math.round(percentage * 10) / 10,
          budgetRemaining: Math.round(budgetRemaining * 100) / 100,
          isOverBudget: item.budgetLimit > 0 && item.totalAmount > item.budgetLimit,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Daily breakdown for the month
    const dailyMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }
    expenses.forEach((e) => {
      const dayNum = parseInt(e.expenseDate.split('-')[2], 10);
      if (dailyMap[dayNum] !== undefined) {
        dailyMap[dayNum] += e.amount;
      }
    });

    const dailySpending = Object.entries(dailyMap).map(([day, amount]) => ({
      day: Number(day),
      date: `${year}-${month < 10 ? '0' + month : month}-${Number(day) < 10 ? '0' + day : day}`,
      amount: Math.round(amount * 100) / 100,
    }));

    // Find highest spending category and highest single transaction
    const topCategory = categoryBreakdown.find((c) => c.totalAmount > 0) || null;
    const sortedExpenses = [...expenses].sort((a, b) => b.amount - a.amount);
    const largestTransaction = sortedExpenses[0] || null;

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        totalSpent: Math.round(totalSpent * 100) / 100,
        prevTotalSpent: Math.round(prevTotalSpent * 100) / 100,
        monthDifference: Math.round(monthDifference * 100) / 100,
        percentageChange: Math.round(percentageChange * 10) / 10,
        averageDailySpend: Math.round(averageDailySpend * 100) / 100,
        transactionCount: expenses.length,
        daysInMonth,
        effectiveDays,
        topCategory,
        largestTransaction,
        categoryBreakdown,
        dailySpending,
      },
    });
  } catch (err: any) {
    console.error('getMonthlyReport error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate monthly report.' });
  }
}

export function getTrendsReport(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const monthsCount = req.query.months ? Math.min(12, Math.max(3, Number(req.query.months))) : 6;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyTrends: {
      year: number;
      month: number;
      monthLabel: string;
      totalSpent: number;
      transactionCount: number;
      categoryBreakdown: Record<string, number>;
    }[] = [];

    const categories = db.getCategories(userId);

    for (let i = monthsCount - 1; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = target.getFullYear();
      const m = target.getMonth() + 1;

      const exps = db.getExpenses(userId, { month: m, year: y });
      const total = exps.reduce((sum, e) => sum + e.amount, 0);

      const catAmounts: Record<string, number> = {};
      categories.forEach((c) => {
        catAmounts[c.slug] = 0;
      });

      exps.forEach((e) => {
        const cat = categories.find((c) => c.id === e.categoryId);
        const slug = cat ? cat.slug : 'other';
        catAmounts[slug] = (catAmounts[slug] || 0) + e.amount;
      });

      monthlyTrends.push({
        year: y,
        month: m,
        monthLabel: `${monthNames[m - 1]} ${y.toString().slice(-2)}`,
        totalSpent: Math.round(total * 100) / 100,
        transactionCount: exps.length,
        categoryBreakdown: catAmounts,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trends: monthlyTrends,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
        })),
      },
    });
  } catch (err: any) {
    console.error('getTrendsReport error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve expenditure trends.' });
  }
}

export function getBudgets(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    const budgets = db.getBudgets(userId, month, year);
    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (err: any) {
    console.error('getBudgets error:', err);
    res.status(500).json({ success: false, message: 'Failed to get budgets.' });
  }
}

export function setBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { categoryId, monthlyLimit, month, year } = req.body;

    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Category is required.' });
      return;
    }

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit < 0) {
      res.status(400).json({ success: false, message: 'Limit must be zero or a positive amount.' });
      return;
    }

    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();

    const saved = db.setBudget(userId, categoryId, limit, m, y);

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully.',
      data: saved,
    });
  } catch (err: any) {
    console.error('setBudget error:', err);
    res.status(500).json({ success: false, message: 'Failed to set budget.' });
  }
}
