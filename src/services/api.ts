import {
  User,
  Category,
  Expense,
  MonthlyReport,
  TrendsReport,
  Budget,
  CodeFile,
} from '../types';

const TOKEN_KEY = 'spendflow_jwt_token';
const USER_KEY = 'spendflow_user_profile';

export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token if expired or invalid
      storage.clear();
    }
    const message = data.message || `API error: ${response.statusText} (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Auth
  register: async (username: string, mail: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await apiFetch<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, mail, password }),
    });
    storage.setToken(res.token);
    storage.setUser(res.user);
    return res;
  },

  login: async (identifier: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await apiFetch<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    storage.setToken(res.token);
    storage.setUser(res.user);
    return res;
  },

  getMe: async (): Promise<User> => {
    const res = await apiFetch<{ success: boolean; user: User }>('/api/auth/me');
    storage.setUser(res.user);
    return res.user;
  },

  logout: () => {
    storage.clear();
  },

  // Expenses
  getExpenses: async (params?: {
    month?: number;
    year?: number;
    categoryId?: string;
    search?: string;
    sortBy?: 'date' | 'amount' | 'title';
    order?: 'asc' | 'desc';
  }): Promise<Expense[]> => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', params.month.toString());
    if (params?.year) query.append('year', params.year.toString());
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.order) query.append('order', params.order);

    const qs = query.toString();
    const endpoint = `/api/expenses${qs ? `?${qs}` : ''}`;
    const res = await apiFetch<{ success: boolean; data: Expense[] }>(endpoint);
    return res.data;
  },

  createExpense: async (expense: {
    title: string;
    amount: number;
    categoryId: string;
    expenseDate: string;
    paymentMethod: string;
    notes?: string;
  }): Promise<Expense> => {
    const res = await apiFetch<{ success: boolean; data: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    return res.data;
  },

  updateExpense: async (
    id: string,
    updates: {
      title?: string;
      amount?: number;
      categoryId?: string;
      expenseDate?: string;
      paymentMethod?: string;
      notes?: string;
    }
  ): Promise<Expense> => {
    const res = await apiFetch<{ success: boolean; data: Expense }>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await apiFetch<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await apiFetch<{ success: boolean; data: Category[] }>('/api/categories');
    return res.data;
  },

  createCategory: async (category: {
    name: string;
    color: string;
    icon: string;
    description?: string;
  }): Promise<Category> => {
    const res = await apiFetch<{ success: boolean; data: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return res.data;
  },

  // Reports
  getMonthlyReport: async (month?: number, year?: number): Promise<MonthlyReport> => {
    const query = new URLSearchParams();
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    const qs = query.toString();
    const endpoint = `/api/reports/monthly${qs ? `?${qs}` : ''}`;
    const res = await apiFetch<{ success: boolean; data: MonthlyReport }>(endpoint);
    return res.data;
  },

  getTrendsReport: async (months: number = 6): Promise<TrendsReport> => {
    const endpoint = `/api/reports/trends?months=${months}`;
    const res = await apiFetch<{ success: boolean; data: TrendsReport }>(endpoint);
    return res.data;
  },

  // Budgets
  getBudgets: async (month?: number, year?: number): Promise<Budget[]> => {
    const query = new URLSearchParams();
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    const qs = query.toString();
    const endpoint = `/api/budgets${qs ? `?${qs}` : ''}`;
    const res = await apiFetch<{ success: boolean; data: Budget[] }>(endpoint);
    return res.data;
  },

  setBudget: async (budget: {
    categoryId: string;
    monthlyLimit: number;
    month?: number;
    year?: number;
  }): Promise<Budget> => {
    const res = await apiFetch<{ success: boolean; data: Budget }>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
    return res.data;
  },

  // Spring Boot docs & Schema
  getSpringBootDocs: async (): Promise<CodeFile[]> => {
    const res = await apiFetch<{ success: boolean; files: CodeFile[] }>('/api/system/springboot-docs');
    return res.files;
  },

  getSchemaSql: async (): Promise<string> => {
    const res = await apiFetch<{ success: boolean; schemaSql: string }>('/api/system/schema-sql');
    return res.schemaSql;
  },
};
