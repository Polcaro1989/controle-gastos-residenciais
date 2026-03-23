import type {
  Category,
  CategoryCreateRequest,
  CategoryTotalsReport,
  FinancialTransaction,
  Person,
  PersonTotalsReport,
  PersonUpsertRequest,
  TransactionCreateRequest,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return `A requisição falhou com status ${response.status}.`;
  }

  const body = (await response.json()) as {
    title?: string;
    errors?: Record<string, string[]>;
  };

  if (body.errors) {
    const firstError = Object.values(body.errors)[0];

    if (firstError && firstError.length > 0) {
      return firstError[0];
    }
  }

  return body.title ?? `A requisição falhou com status ${response.status}.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listPeople() {
    return request<Person[]>("/people");
  },
  createPerson(payload: PersonUpsertRequest) {
    return request<Person>("/people", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updatePerson(personId: number, payload: PersonUpsertRequest) {
    return request<Person>(`/people/${personId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deletePerson(personId: number) {
    return request<void>(`/people/${personId}`, {
      method: "DELETE",
    });
  },
  listCategories() {
    return request<Category[]>("/categories");
  },
  createCategory(payload: CategoryCreateRequest) {
    return request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  listTransactions() {
    return request<FinancialTransaction[]>("/transactions");
  },
  createTransaction(payload: TransactionCreateRequest) {
    return request<FinancialTransaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getPeopleTotals() {
    return request<PersonTotalsReport>("/reports/people-totals");
  },
  getCategoryTotals() {
    return request<CategoryTotalsReport>("/reports/category-totals");
  },
};
