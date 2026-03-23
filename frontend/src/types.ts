export type CategoryPurpose = "Expense" | "Income" | "Both";
export type TransactionType = "Expense" | "Income";

export interface Person {
  id: number;
  name: string;
  age: number;
}

export interface Category {
  id: number;
  description: string;
  purpose: CategoryPurpose;
}

export interface FinancialTransaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: number;
  categoryDescription: string;
  categoryPurpose: CategoryPurpose;
  personId: number;
  personName: string;
  createdAtUtc: string;
}

export interface TotalsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface PersonTotalsItem {
  personId: number;
  personName: string;
  age: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface PersonTotalsReport {
  people: PersonTotalsItem[];
  overall: TotalsSummary;
}

export interface CategoryTotalsItem {
  categoryId: number;
  categoryDescription: string;
  purpose: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryTotalsReport {
  categories: CategoryTotalsItem[];
  overall: TotalsSummary;
}

export interface PersonUpsertRequest {
  name: string;
  age: number;
}

export interface CategoryCreateRequest {
  description: string;
  purpose: CategoryPurpose;
}

export interface TransactionCreateRequest {
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: number;
  personId: number;
}
