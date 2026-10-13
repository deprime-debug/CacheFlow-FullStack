import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserRow {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  isDefault: boolean;
  userId?: string | null;
  createdAt: string;
}

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'OTHER';

export interface ExpenseRow {
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
}

export interface BudgetRow {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  month: number; // 1-12
  year: number;
  createdAt: string;
}

interface DatabaseState {
  users: UserRow[];
  categories: CategoryRow[];
  expenses: ExpenseRow[];
  budgets: BudgetRow[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Standard default categories
export const DEFAULT_CATEGORIES: Omit<CategoryRow, 'id' | 'createdAt'>[] = [
  {
    name: 'Food & Dining',
    slug: 'food',
    color: '#f97316', // Orange
    icon: 'Utensils',
    description: 'Groceries, restaurants, cafes, snacks, and meal deliveries',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Travel & Transport',
    slug: 'travel',
    color: '#0284c7', // Sky Blue
    icon: 'Plane',
    description: 'Flights, train/bus tickets, cabs, fuel, metro, and parking',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Entertainment & Leisure',
    slug: 'entertainment',
    color: '#8b5cf6', // Violet
    icon: 'Film',
    description: 'Movies, concerts, gaming, streaming subscriptions, events',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Utilities & Bills',
    slug: 'utilities',
    color: '#059669', // Emerald
    icon: 'Zap',
    description: 'Electricity, water, gas, Wi-Fi, mobile recharges, maintenance',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Shopping & Retail',
    slug: 'shopping',
    color: '#ec4899', // Pink
    icon: 'ShoppingBag',
    description: 'Clothing, gadgets, accessories, books, home supplies',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Health & Wellness',
    slug: 'healthcare',
    color: '#ef4444', // Red
    icon: 'HeartPulse',
    description: 'Doctor visits, pharmacy, gym membership, medical insurance',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Work & Education',
    slug: 'education',
    color: '#d97706', // Amber
    icon: 'GraduationCap',
    description: 'Courses, books, software tools, professional fees',
    isDefault: true,
    userId: null,
  },
  {
    name: 'Miscellaneous',
    slug: 'other',
    color: '#64748b', // Slate
    icon: 'Layers',
    description: 'Uncategorized personal spending and ad-hoc expenses',
    isDefault: true,
    userId: null,
  },
];

class DatabaseService {
  private data: DatabaseState = {
    users: [],
    categories: [],
    expenses: [],
    budgets: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file, initializing in-memory fallback:', err);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    
    // Seed default categories
    const categories: CategoryRow[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
      ...cat,
      id: `cat_${idx + 1}`,
      createdAt: now,
    }));

    // Seed Demo User
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('password123', salt);
    const demoUser: UserRow = {
      id: 'usr_demo_101',
      username: 'alex_finance',
      email: 'alex@example.com',
      passwordHash: demoPasswordHash,
      createdAt: now,
    };

    // Helper map of category IDs
    const catMap: Record<string, string> = {};
    categories.forEach(c => {
      catMap[c.slug] = c.id;
    });

    // Seed realistic expenses across current month and past 3 months
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    const sampleExpenses: ExpenseRow[] = [];

    // Helper to format date YYYY-MM-DD
    const formatDate = (y: number, m: number, d: number) => {
      const mm = m < 10 ? `0${m}` : `${m}`;
      const dd = d < 10 ? `0${d}` : `${d}`;
      return `${y}-${mm}-${dd}`;
    };

    // Generate spending for current month and 3 prior months
    const monthOffsets = [0, -1, -2, -3];

    let expCounter = 1;

    monthOffsets.forEach((offset) => {
      const targetDate = new Date(currentYear, currentMonth - 1 + offset, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth() + 1;

      // Expense items for Food
      sampleExpenses.push(
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['food'],
          title: 'Whole Foods Organic Groceries',
          amount: 142.50,
          expenseDate: formatDate(y, m, 3),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Weekly fresh produce, dairy, and pantry restock',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['food'],
          title: 'Artisan Bistro Dinner with Team',
          amount: 88.00,
          expenseDate: formatDate(y, m, 9),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Dinner celebrate project milestone',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['food'],
          title: 'Blue Bottle Specialty Coffee & Bagels',
          amount: 24.75,
          expenseDate: formatDate(y, m, 14),
          paymentMethod: 'UPI',
          notes: 'Morning coffee meeting',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['food'],
          title: 'Supermarket Farmers Market Supply',
          amount: 115.20,
          expenseDate: formatDate(y, m, 21),
          paymentMethod: 'DEBIT_CARD',
          notes: 'Monthly staples & dry goods',
          createdAt: now,
          updatedAt: now,
        }
      );

      // Travel
      sampleExpenses.push(
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['travel'],
          title: 'Express Commute Train Pass',
          amount: 95.00,
          expenseDate: formatDate(y, m, 2),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Monthly regional rail & metro transit card',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['travel'],
          title: offset === 0 ? 'Airport Uber Shuttle Service' : 'Weekend Highway Fuel & Tolls',
          amount: offset === 0 ? 48.50 : 62.00,
          expenseDate: formatDate(y, m, 12),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Travel transit trip',
          createdAt: now,
          updatedAt: now,
        }
      );

      // Entertainment
      sampleExpenses.push(
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['entertainment'],
          title: 'IMAX Cinema Movie Tickets & Snacks',
          amount: 42.00,
          expenseDate: formatDate(y, m, 7),
          paymentMethod: 'DEBIT_CARD',
          notes: 'Weekend sci-fi premiere screening',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['entertainment'],
          title: 'Spotify & Netflix Monthly Subscriptions',
          amount: 28.98,
          expenseDate: formatDate(y, m, 18),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Recurring digital entertainment plans',
          createdAt: now,
          updatedAt: now,
        }
      );

      // Utilities
      sampleExpenses.push(
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['utilities'],
          title: 'High-Speed Fiber Optic Internet',
          amount: 69.99,
          expenseDate: formatDate(y, m, 5),
          paymentMethod: 'BANK_TRANSFER',
          notes: '1 Gbps symmetrical broadband bill',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['utilities'],
          title: 'City Power & Electricity Utility',
          amount: 84.30,
          expenseDate: formatDate(y, m, 15),
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Monthly power consumption invoice',
          createdAt: now,
          updatedAt: now,
        }
      );

      // Shopping / Health
      sampleExpenses.push(
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['shopping'],
          title: 'Ergonomic Desk Accessories & Notebooks',
          amount: 54.40,
          expenseDate: formatDate(y, m, 16),
          paymentMethod: 'CREDIT_CARD',
          notes: 'Productivity equipment and sketchbooks',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `exp_${expCounter++}`,
          userId: demoUser.id,
          categoryId: catMap['healthcare'],
          title: 'Fitness Gym Membership & Protein',
          amount: 75.00,
          expenseDate: formatDate(y, m, 1),
          paymentMethod: 'DEBIT_CARD',
          notes: 'Monthly fitness pass and vitamins',
          createdAt: now,
          updatedAt: now,
        }
      );
    });

    // Budgets for demo user
    const budgets: BudgetRow[] = [
      {
        id: 'bud_1',
        userId: demoUser.id,
        categoryId: catMap['food'],
        monthlyLimit: 450,
        month: currentMonth,
        year: currentYear,
        createdAt: now,
      },
      {
        id: 'bud_2',
        userId: demoUser.id,
        categoryId: catMap['travel'],
        monthlyLimit: 200,
        month: currentMonth,
        year: currentYear,
        createdAt: now,
      },
      {
        id: 'bud_3',
        userId: demoUser.id,
        categoryId: catMap['entertainment'],
        monthlyLimit: 120,
        month: currentMonth,
        year: currentYear,
        createdAt: now,
      },
      {
        id: 'bud_4',
        userId: demoUser.id,
        categoryId: catMap['utilities'],
        monthlyLimit: 180,
        month: currentMonth,
        year: currentYear,
        createdAt: now,
      },
      {
        id: 'bud_5',
        userId: demoUser.id,
        categoryId: catMap['shopping'],
        monthlyLimit: 150,
        month: currentMonth,
        year: currentYear,
        createdAt: now,
      },
    ];

    this.data = {
      users: [demoUser],
      categories,
      expenses: sampleExpenses,
      budgets,
    };
  }

  // User Operations
  findUserById(id: string): UserRow | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string): UserRow | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string): UserRow | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(username: string, email: string, passwordHash: string): UserRow {
    const newUser: UserRow = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Categories Operations
  getCategories(userId?: string): CategoryRow[] {
    return this.data.categories.filter((cat) => cat.isDefault || cat.userId === userId);
  }

  findCategoryById(id: string): CategoryRow | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  createCategory(userId: string, name: string, color: string, icon: string, description: string): CategoryRow {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newCat: CategoryRow = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      color,
      icon,
      description,
      isDefault: false,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  // Expenses Operations
  getExpenses(userId: string, filter?: {
    month?: number;
    year?: number;
    categoryId?: string;
    search?: string;
    sortBy?: 'date' | 'amount' | 'title';
    order?: 'asc' | 'desc';
  }): (ExpenseRow & { category: CategoryRow })[] {
    let list = this.data.expenses.filter((e) => e.userId === userId);

    if (filter?.year) {
      list = list.filter((e) => {
        const d = new Date(e.expenseDate);
        return d.getFullYear() === filter.year;
      });
    }

    if (filter?.month) {
      list = list.filter((e) => {
        const d = new Date(e.expenseDate);
        return d.getMonth() + 1 === filter.month;
      });
    }

    if (filter?.categoryId && filter.categoryId !== 'all') {
      list = list.filter((e) => e.categoryId === filter.categoryId);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter((e) => 
        e.title.toLowerCase().includes(q) || 
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    const sortBy = filter?.sortBy || 'date';
    const order = filter?.order || 'desc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
      } else if (sortBy === 'amount') {
        cmp = b.amount - a.amount;
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      }
      return order === 'asc' ? -cmp : cmp;
    });

    const categories = this.getCategories(userId);
    const catMap = new Map(categories.map((c) => [c.id, c]));

    return list.map((e) => ({
      ...e,
      category: catMap.get(e.categoryId) || {
        id: e.categoryId,
        name: 'General',
        slug: 'general',
        color: '#64748b',
        icon: 'Tag',
        description: 'General category',
        isDefault: true,
        createdAt: e.createdAt,
      },
    }));
  }

  findExpenseById(id: string): ExpenseRow | undefined {
    return this.data.expenses.find((e) => e.id === id);
  }

  createExpense(expense: Omit<ExpenseRow, 'id' | 'createdAt' | 'updatedAt'>): ExpenseRow {
    const now = new Date().toISOString();
    const newExpense: ExpenseRow = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.expenses.push(newExpense);
    this.save();
    return newExpense;
  }

  updateExpense(id: string, userId: string, updates: Partial<Omit<ExpenseRow, 'id' | 'userId' | 'createdAt'>>): ExpenseRow | null {
    const index = this.data.expenses.findIndex((e) => e.id === id && e.userId === userId);
    if (index === -1) return null;

    const current = this.data.expenses[index];
    const updated: ExpenseRow = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.expenses[index] = updated;
    this.save();
    return updated;
  }

  deleteExpense(id: string, userId: string): boolean {
    const index = this.data.expenses.findIndex((e) => e.id === id && e.userId === userId);
    if (index === -1) return false;
    this.data.expenses.splice(index, 1);
    this.save();
    return true;
  }

  // Budgets
  getBudgets(userId: string, month: number, year: number): BudgetRow[] {
    return this.data.budgets.filter((b) => b.userId === userId && b.month === month && b.year === year);
  }

  setBudget(userId: string, categoryId: string, monthlyLimit: number, month: number, year: number): BudgetRow {
    const index = this.data.budgets.findIndex(
      (b) => b.userId === userId && b.categoryId === categoryId && b.month === month && b.year === year
    );

    const now = new Date().toISOString();
    if (index >= 0) {
      this.data.budgets[index].monthlyLimit = monthlyLimit;
      this.save();
      return this.data.budgets[index];
    } else {
      const newBudget: BudgetRow = {
        id: `bud_${Date.now()}`,
        userId,
        categoryId,
        monthlyLimit,
        month,
        year,
        createdAt: now,
      };
      this.data.budgets.push(newBudget);
      this.save();
      return newBudget;
    }
  }
}

export const db = new DatabaseService();
