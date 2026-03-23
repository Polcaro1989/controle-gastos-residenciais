import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { api } from "./api";
import type {
  Category,
  CategoryCreateRequest,
  CategoryPurpose,
  CategoryTotalsReport,
  FinancialTransaction,
  Person,
  PersonTotalsReport,
  PersonUpsertRequest,
  TotalsSummary,
  TransactionCreateRequest,
  TransactionType,
} from "./types";

type SectionKey = "people" | "categories" | "transactions" | "reports";
type AccentTone = "teal" | "amber" | "slate";

interface PersonFormState {
  name: string;
  age: string;
}

interface CategoryFormState {
  description: string;
  purpose: CategoryPurpose;
}

interface TransactionFormState {
  description: string;
  amount: string;
  type: TransactionType;
  categoryId: string;
  personId: string;
}

const navigationItems: Array<{ key: SectionKey; label: string }> = [
  { key: "people", label: "Pessoas" },
  { key: "categories", label: "Categorias" },
  { key: "transactions", label: "Transações" },
  { key: "reports", label: "Relatórios" },
];

const emptyPersonForm: PersonFormState = {
  name: "",
  age: "",
};

const emptyCategoryForm: CategoryFormState = {
  description: "",
  purpose: "Expense",
};

const emptyTransactionForm: TransactionFormState = {
  description: "",
  amount: "",
  type: "Expense",
  categoryId: "",
  personId: "",
};

const emptyTotals: TotalsSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

function showSuccessToast(title: string): void {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  void Swal.mixin({
    toast: true,
    position: isMobile ? "top" : "bottom-start",
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
    width: 420,
    customClass: {
      popup: "app-toast-popup",
      title: "app-toast-title",
    },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  }).fire({
    icon: "success",
    title,
  });
}

const feedbackAlert = Swal.mixin({
  confirmButtonText: "Fechar",
  customClass: {
    popup: "app-alert-popup",
    title: "app-alert-title",
    confirmButton: "app-alert-confirm",
    cancelButton: "app-alert-cancel",
  },
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const shellPanelClass =
  "relative overflow-hidden rounded-[32px] border border-white/70 bg-white/72 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl";
const sectionPanelClass = `${shellPanelClass} p-5 sm:p-6 lg:p-7`;
const fieldClass =
  "w-full rounded-[22px] border border-slate-200/80 bg-white/92 px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#155e75] focus:ring-0";
const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[#c7931f]/22 bg-[#12384d] px-5 py-3 text-sm font-semibold text-[#fffdf8] shadow-[0_14px_32px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0d2c3e] hover:shadow-[0_18px_34px_rgba(15,23,42,0.28)] disabled:cursor-wait disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[#155e75]/20 bg-white/88 px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:border-[#155e75]/35 hover:bg-white hover:text-slate-950 disabled:cursor-wait disabled:opacity-60";
const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full border border-amber-300/80 bg-amber-50/90 px-5 py-3 text-sm font-semibold text-amber-900 transition duration-200 hover:border-amber-400 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60";
const eyebrowClass = "text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#155e75]/70";

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function parseAmountInput(value: string): number | null {
  const sanitizedValue = value.trim().replace(/\s+/g, "");

  if (sanitizedValue.length === 0 || /[^0-9.,]/.test(sanitizedValue)) {
    return null;
  }

  let normalizedValue = sanitizedValue;
  const hasDot = sanitizedValue.includes(".");
  const hasComma = sanitizedValue.includes(",");

  // Aceita convenções pt-BR e en-US para reduzir erro de entrada no valor monetário.
  if (hasDot && hasComma) {
    const decimalSeparator =
      sanitizedValue.lastIndexOf(".") > sanitizedValue.lastIndexOf(",") ? "." : ",";
    const thousandSeparator = decimalSeparator === "." ? "," : ".";

    normalizedValue = sanitizedValue.split(thousandSeparator).join("");
    normalizedValue = normalizedValue.replace(decimalSeparator, ".");
  } else if (hasDot || hasComma) {
    const separator = hasDot ? "." : ",";
    const parts = sanitizedValue.split(separator);

    if (parts.length === 2) {
      const [integerPart, decimalOrThousandsPart] = parts;

      normalizedValue =
        decimalOrThousandsPart.length === 3
          ? `${integerPart}${decimalOrThousandsPart}`
          : `${integerPart}.${decimalOrThousandsPart}`;
    } else {
      const lastPart = parts.at(-1) ?? "";

      normalizedValue =
        lastPart.length <= 2
          ? `${parts.slice(0, -1).join("")}.${lastPart}`
          : parts.join("");
    }
  }

  if ((normalizedValue.match(/\./g) ?? []).length > 1) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function formatId(value: number): string {
  return String(value).padStart(3, "0");
}

function translatePurpose(purpose: string): string {
  if (purpose === "Expense") {
    return "Despesa";
  }

  if (purpose === "Income") {
    return "Receita";
  }

  return "Ambas";
}

function translateType(type: TransactionType): string {
  return type === "Expense" ? "Despesa" : "Receita";
}

function badgeClass(value: string): string {
  if (value === "Expense") {
    return "inline-flex items-center rounded-full border border-amber-300/80 bg-amber-50/90 px-3 py-1.5 text-xs font-semibold text-amber-900";
  }

  if (value === "Income") {
    return "inline-flex items-center rounded-full border border-[#155e75]/25 bg-[#eef7fa] px-3 py-1.5 text-xs font-semibold text-[#0f172a]";
  }

  return "inline-flex items-center rounded-full border border-slate-300/80 bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-900";
}

function statCardClass(tone: AccentTone): string {
  if (tone === "teal") {
    return "rounded-[28px] border border-[#155e75]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(218,238,244,0.92))] p-5 shadow-[0_18px_45px_rgba(21,94,117,0.14)]";
  }

  if (tone === "amber") {
    return "rounded-[28px] border border-amber-300/65 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(253,230,138,0.52))] p-5 shadow-[0_18px_45px_rgba(245,158,11,0.14)]";
  }

  return "rounded-[28px] border border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(226,232,240,0.88))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]";
}

function purposeTone(purpose: string): AccentTone {
  if (purpose === "Expense") {
    return "amber";
  }

  if (purpose === "Income") {
    return "teal";
  }

  return "slate";
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[30px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
      <p className="font-display text-xl text-slate-900">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function InsightCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: AccentTone;
}) {
  return (
    <article className={statCardClass(tone)}>
      <p className={eyebrowClass}>{label}</p>
      <strong className="font-display mt-3 block text-[1.9rem] leading-none text-slate-950">
        {value}
      </strong>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function MetaTile({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: AccentTone;
}) {
  const toneClass =
    tone === "teal"
      ? "bg-[#eef7fa] text-[#0f172a]"
      : tone === "amber"
        ? "bg-amber-50 text-amber-950"
        : "bg-slate-100 text-slate-900";

  return (
    <div className={`rounded-[22px] px-4 py-3 ${toneClass}`}>
      <span className={`${eyebrowClass} !tracking-[0.2em] !text-current/60`}>{label}</span>
      <strong className="mt-2 block text-base font-semibold text-current">{value}</strong>
    </div>
  );
}

function tabButtonClass(isActive: boolean): string {
  return isActive
    ? "group w-full rounded-[24px] border border-[#c7931f]/24 bg-[#12384d] px-4 py-3 text-left text-[#fffdf8] shadow-[0_16px_34px_rgba(15,23,42,0.22)] transition duration-200"
    : "group w-full rounded-[24px] border border-white/70 bg-white/70 px-4 py-3 text-left text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:text-slate-950";
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionKey>("people");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [peopleReport, setPeopleReport] = useState<PersonTotalsReport | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryTotalsReport | null>(null);
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(emptyTransactionForm);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPerson = people.find((item) => item.id === Number(transactionForm.personId)) ?? null;
  const selectedCategory =
    categories.find((item) => item.id === Number(transactionForm.categoryId)) ?? null;

  // O frontend espelha a regra do backend para orientar o usuário antes do submit.
  const allowedTransactionTypes: TransactionType[] =
    selectedPerson && selectedPerson.age < 18 ? ["Expense"] : ["Expense", "Income"];

  // A API continua sendo a fonte final da regra, mas aqui a interface já filtra as opções inválidas.
  const compatibleCategories = categories.filter((category) => {
    return category.purpose === "Both" || category.purpose === transactionForm.type;
  });

  const overallTotals = peopleReport?.overall ?? emptyTotals;

  useEffect(() => {
    void loadApplicationData();
  }, []);

  useEffect(() => {
    if (selectedPerson && selectedPerson.age < 18 && transactionForm.type === "Income") {
      setTransactionForm((current) => ({
        ...current,
        type: "Expense",
      }));
    }
  }, [selectedPerson, transactionForm.type]);

  useEffect(() => {
    if (!transactionForm.categoryId) {
      return;
    }

    const currentCategoryIsValid = compatibleCategories.some(
      (category) => category.id === Number(transactionForm.categoryId),
    );

    if (!currentCategoryIsValid) {
      setTransactionForm((current) => ({
        ...current,
        categoryId: "",
      }));
    }
  }, [compatibleCategories, transactionForm.categoryId]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleSectionSelect(section: SectionKey): void {
    setActiveSection(section);
    setIsMenuOpen(false);
  }

  function showActionError(message: string): void {
    void feedbackAlert.fire({
      icon: "error",
      title: "Não foi possível concluir",
      text: message,
    });
  }

  async function loadApplicationData(): Promise<void> {
    setLoading(true);
    setErrorMessage("");

    try {
      // Todas as visões leem a mesma fonte da API para manter listas e totais sincronizados.
      const [peopleData, categoriesData, transactionsData, peopleTotalsData, categoryTotalsData] =
        await Promise.all([
          api.listPeople(),
          api.listCategories(),
          api.listTransactions(),
          api.getPeopleTotals(),
          api.getCategoryTotals(),
        ]);

      setPeople(peopleData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setPeopleReport(peopleTotalsData);
      setCategoryReport(categoryTotalsData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  function resetPersonForm(): void {
    setPersonForm(emptyPersonForm);
    setEditingPersonId(null);
  }

  function handlePersonChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;

    setPersonForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCategoryChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const { name, value } = event.target;

    setCategoryForm((current) => ({
      ...current,
      [name]: value,
    }) as CategoryFormState);
  }

  function handleTransactionChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;

    setTransactionForm((current) => ({
      ...current,
      [name]: value,
    }) as TransactionFormState);
  }

  async function handlePersonSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const trimmedName = personForm.name.trim();
    const ageValue = personForm.age.trim();

    if (!trimmedName) {
      showActionError("Informe o nome da pessoa.");
      setSubmitting(false);
      return;
    }

    if (!ageValue) {
      showActionError("Informe a idade da pessoa.");
      setSubmitting(false);
      return;
    }

    const parsedAge = Number(ageValue);

    if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      showActionError("Informe uma idade válida entre 0 e 130 anos.");
      setSubmitting(false);
      return;
    }

    const payload: PersonUpsertRequest = {
      name: trimmedName,
      age: parsedAge,
    };

    try {
      if (editingPersonId === null) {
        await api.createPerson(payload);
      } else {
        await api.updatePerson(editingPersonId, payload);
      }

      const wasCreating = editingPersonId === null;
      resetPersonForm();
      await loadApplicationData();
      showSuccessToast(
        wasCreating ? "Pessoa criada com sucesso." : "Pessoa atualizada com sucesso.",
      );
    } catch (error) {
      showActionError(error instanceof Error ? error.message : "Falha ao salvar a pessoa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removePerson(person: Person): Promise<void> {
    const confirmation = await Swal.fire({
      title: "Excluir pessoa?",
      text: `Todas as transações de ${person.name} também serão removidas.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      confirmButtonColor: "#9b3a34",
      cancelButtonColor: "#5b6869",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.deletePerson(person.id);

      if (editingPersonId === person.id) {
        resetPersonForm();
      }

      if (transactionForm.personId === String(person.id)) {
        setTransactionForm((current) => ({
          ...current,
          personId: "",
        }));
      }

      await loadApplicationData();
      showSuccessToast("Pessoa removida com sucesso.");
    } catch (error) {
      showActionError(error instanceof Error ? error.message : "Falha ao excluir a pessoa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const trimmedDescription = categoryForm.description.trim();

    if (!trimmedDescription) {
      showActionError("Informe a descrição da categoria.");
      setSubmitting(false);
      return;
    }

    const payload: CategoryCreateRequest = {
      description: trimmedDescription,
      purpose: categoryForm.purpose,
    };

    try {
      await api.createCategory(payload);
      setCategoryForm(emptyCategoryForm);
      await loadApplicationData();
      showSuccessToast("Categoria criada com sucesso.");
    } catch (error) {
      showActionError(error instanceof Error ? error.message : "Falha ao salvar a categoria.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const parsedAmount = parseAmountInput(transactionForm.amount);
    const trimmedDescription = transactionForm.description.trim();

    if (!trimmedDescription) {
      showActionError("Informe a descrição da transação.");
      setSubmitting(false);
      return;
    }

    if (!selectedPerson) {
      showActionError("Selecione uma pessoa válida para registrar a transação.");
      setSubmitting(false);
      return;
    }

    if (!selectedCategory) {
      showActionError("Selecione uma categoria válida para registrar a transação.");
      setSubmitting(false);
      return;
    }

    if (parsedAmount === null) {
      showActionError(
        "Informe um valor válido. Exemplos aceitos: 5000, 5.000, 5,000, 5.000,50 ou 5,000.50.",
      );
      setSubmitting(false);
      return;
    }

    if (selectedPerson.age < 18 && transactionForm.type === "Income") {
      showActionError("Menores de idade podem registrar apenas despesas.");
      setSubmitting(false);
      return;
    }

    const payload: TransactionCreateRequest = {
      description: trimmedDescription,
      amount: parsedAmount,
      type: transactionForm.type,
      categoryId: Number(transactionForm.categoryId),
      personId: Number(transactionForm.personId),
    };

    try {
      await api.createTransaction(payload);
      setTransactionForm({
        ...emptyTransactionForm,
        personId: transactionForm.personId,
      });
      await loadApplicationData();
      showSuccessToast("Transação registrada com sucesso.");
    } catch (error) {
      showActionError(error instanceof Error ? error.message : "Falha ao salvar a transação.");
    } finally {
      setSubmitting(false);
    }
  }

  function startPersonEdit(person: Person): void {
    setActiveSection("people");
    setEditingPersonId(person.id);
    setPersonForm({
      name: person.name,
      age: String(person.age),
    });
  }

  function renderPeopleSection() {
    return (
      <main className="grid gap-4 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <section className={sectionPanelClass}>
          <div className="rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(254,243,199,0.46),rgba(209,250,229,0.48))] p-5">
            <h2 className="font-display text-[1.9rem] leading-tight text-slate-950">
              {editingPersonId === null ? "Nova pessoa" : "Editar pessoa"}
            </h2>
          </div>

          <form className="mt-5 grid gap-4" noValidate onSubmit={handlePersonSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nome
              <input
                className={fieldClass}
                maxLength={200}
                name="name"
                onChange={handlePersonChange}
                placeholder="Nome completo"
                required
                value={personForm.name}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Idade
              <input
                className={fieldClass}
                max={130}
                min={0}
                name="age"
                onChange={handlePersonChange}
                placeholder="Idade"
                required
                type="number"
                value={personForm.age}
              />
            </label>

            <div className="rounded-[24px] bg-slate-50/90 px-4 py-4 text-sm leading-6 text-slate-600">
              Pessoas menores de 18 anos continuam limitadas a despesas no cadastro de transações.
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button className={primaryButtonClass} disabled={submitting} type="submit">
                {submitting
                  ? "Salvando..."
                  : editingPersonId === null
                    ? "Salvar pessoa"
                    : "Atualizar pessoa"}
              </button>
              <button className={secondaryButtonClass} onClick={resetPersonForm} type="button">
                {editingPersonId === null ? "Limpar" : "Cancelar edição"}
              </button>
            </div>
          </form>
        </section>

        <section className={sectionPanelClass}>
          <div className="mb-6 flex justify-end">
            <div className={statCardClass("slate")}>
              <p className={eyebrowClass}>Total</p>
              <strong className="font-display mt-3 block text-[2rem] leading-none text-slate-950">
                {formatId(people.length)}
              </strong>
            </div>
          </div>

          {people.length === 0 ? (
            <EmptyState
              description="Comece pela base. Assim que a primeira pessoa entrar, as demais seções ganham contexto real."
              title="Nenhuma pessoa cadastrada"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {people.map((person) => {
                const isMinor = person.age < 18;

                return (
                  <article
                    className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
                    key={person.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={eyebrowClass}>Pessoa {formatId(person.id)}</p>
                        <h3 className="font-display mt-2 text-[1.45rem] leading-tight text-slate-950">
                          {person.name}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          {isMinor
                            ? "Perfil com restrição de receita ativa."
                            : "Perfil apto para receita e despesa."}
                        </p>
                      </div>
                      <span className={badgeClass(isMinor ? "Both" : "Income")}>
                        {isMinor ? "Menor" : "Maior"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <MetaTile label="Idade" tone="slate" value={`${person.age} anos`} />
                      <MetaTile
                        label="Regra"
                        tone={isMinor ? "amber" : "teal"}
                        value={isMinor ? "Apenas despesas" : "Receita liberada"}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        className={secondaryButtonClass}
                        onClick={() => startPersonEdit(person)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className={dangerButtonClass}
                        disabled={submitting}
                        onClick={() => {
                          void removePerson(person);
                        }}
                        type="button"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    );
  }

  function renderCategoriesSection() {
    return (
      <main className="grid gap-4 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <section className={sectionPanelClass}>
          <div className="rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(254,242,242,0.52),rgba(224,242,254,0.46))] p-5">
            <h2 className="font-display text-[1.9rem] leading-tight text-slate-950">Nova categoria</h2>
          </div>

          <form className="mt-5 grid gap-4" noValidate onSubmit={handleCategorySubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Descrição
              <input
                className={fieldClass}
                maxLength={400}
                name="description"
                onChange={handleCategoryChange}
                placeholder="Descrição da categoria"
                required
                value={categoryForm.description}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Finalidade
              <select
                className={fieldClass}
                name="purpose"
                onChange={handleCategoryChange}
                value={categoryForm.purpose}
              >
                <option value="Expense">Despesa</option>
                <option value="Income">Receita</option>
                <option value="Both">Ambas</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetaTile label="Despesa" tone="amber" value="Uso exclusivo" />
              <MetaTile label="Receita" tone="teal" value="Uso exclusivo" />
              <MetaTile label="Ambas" tone="slate" value="Versátil" />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button className={primaryButtonClass} disabled={submitting} type="submit">
                {submitting ? "Salvando..." : "Salvar categoria"}
              </button>
              <button
                className={secondaryButtonClass}
                onClick={() => setCategoryForm(emptyCategoryForm)}
                type="button"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className={sectionPanelClass}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-[2rem] leading-tight text-slate-950">Categorias</h2>
            </div>
            <div className={statCardClass("slate")}>
              <p className={eyebrowClass}>Total</p>
              <strong className="font-display mt-3 block text-[2rem] leading-none text-slate-950">
                {formatId(categories.length)}
              </strong>
            </div>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              description="Crie a primeira categoria para destravar o cadastro de transações com mais contexto."
              title="Nenhuma categoria cadastrada"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <article
                  className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
                  key={category.id}
                >
                  <p className={eyebrowClass}>Categoria {formatId(category.id)}</p>
                  <h3 className="font-display mt-2 text-[1.35rem] leading-tight text-slate-950">
                    {category.description}
                  </h3>
                  <div className="mt-4">
                    <span className={badgeClass(category.purpose)}>{translatePurpose(category.purpose)}</span>
                  </div>
                  <div className="mt-5">
                    <MetaTile
                      label="Compatibilidade"
                      tone={purposeTone(category.purpose)}
                      value={
                        category.purpose === "Both"
                          ? "Despesa e receita"
                          : category.purpose === "Expense"
                            ? "Apenas despesa"
                            : "Apenas receita"
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  function renderTransactionsSection() {
    return (
      <main className="grid gap-4 xl:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
        <section className={sectionPanelClass}>
          <div className="rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(209,250,229,0.48),rgba(254,249,195,0.54))] p-5">
            <h2 className="font-display text-[1.9rem] leading-tight text-slate-950">Nova transação</h2>
          </div>

          <form className="mt-5 grid gap-4" noValidate onSubmit={handleTransactionSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Pessoa
              <select
                className={fieldClass}
                name="personId"
                onChange={handleTransactionChange}
                required
                value={transactionForm.personId}
              >
                <option value="">Selecione</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.age})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Tipo
                <select
                  className={fieldClass}
                  name="type"
                  onChange={handleTransactionChange}
                  value={transactionForm.type}
                >
                  {allowedTransactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {translateType(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Valor
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  name="amount"
                  onChange={handleTransactionChange}
                  placeholder="Ex.: 5.000,00"
                  required
                  type="text"
                  value={transactionForm.amount}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Categoria
              <select
                className={fieldClass}
                name="categoryId"
                onChange={handleTransactionChange}
                required
                value={transactionForm.categoryId}
              >
                <option value="">Selecione</option>
                {compatibleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.description}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className={`${fieldClass} min-h-32 resize-y`}
                maxLength={400}
                name="description"
                onChange={handleTransactionChange}
                placeholder="Descrição da transação"
                required
                value={transactionForm.description}
              />
            </label>

            {selectedPerson && selectedPerson.age < 18 ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm font-medium text-amber-900">
                Menor de idade selecionado: o tipo fica restrito a despesa.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                className={primaryButtonClass}
                disabled={submitting || people.length === 0 || categories.length === 0}
                type="submit"
              >
                {submitting ? "Salvando..." : "Salvar transação"}
              </button>
              <button
                className={secondaryButtonClass}
                onClick={() => setTransactionForm(emptyTransactionForm)}
                type="button"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className={sectionPanelClass}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-[2rem] leading-tight text-slate-950">Transações</h2>
            </div>
            <div className={statCardClass("slate")}>
              <p className={eyebrowClass}>Total</p>
              <strong className="font-display mt-3 block text-[2rem] leading-none text-slate-950">
                {formatId(transactions.length)}
              </strong>
            </div>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              description="Assim que você registrar o primeiro lançamento, esta área vira um resumo rápido do histórico."
              title="Nenhuma transação cadastrada"
            />
          ) : (
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <article
                  className="rounded-[32px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
                  key={transaction.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className={eyebrowClass}>Transação {formatId(transaction.id)}</p>
                      <h3 className="font-display mt-2 text-[1.45rem] leading-tight text-slate-950">
                        {transaction.description}
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={badgeClass(transaction.type)}>{translateType(transaction.type)}</span>
                        <span className={badgeClass(transaction.categoryPurpose)}>
                          {transaction.categoryDescription}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-[26px] bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 py-4 text-white shadow-[0_18px_32px_rgba(15,23,42,0.28)]">
                      <span className="text-[0.72rem] uppercase tracking-[0.26em] text-white/60">
                        Valor
                      </span>
                      <strong className="font-display mt-3 block text-[1.9rem] leading-none">
                        {formatCurrency(transaction.amount)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MetaTile label="Pessoa" tone="slate" value={transaction.personName} />
                    <MetaTile
                      label="Categoria"
                      tone={purposeTone(transaction.categoryPurpose)}
                      value={translatePurpose(transaction.categoryPurpose)}
                    />
                    <MetaTile
                      label="Registrada em"
                      tone="slate"
                      value={formatDateTime(transaction.createdAtUtc)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  function renderReportsSection() {
    return (
      <main className="grid gap-4">
        <section className={sectionPanelClass}>
          <div>
            <h2 className="font-display text-[2.2rem] leading-tight text-slate-950">Relatórios</h2>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <InsightCard
              detail="Tudo que entrou no sistema."
              label="Receitas"
              tone="teal"
              value={formatCurrency(overallTotals.totalIncome)}
            />
            <InsightCard
              detail="Tudo que saiu do sistema."
              label="Despesas"
              tone="amber"
              value={formatCurrency(overallTotals.totalExpense)}
            />
            <InsightCard
              detail="Resultado líquido consolidado (receitas – despesas)."
              label="Saldo"
              tone="slate"
              value={formatCurrency(overallTotals.balance)}
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className={sectionPanelClass}>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.9rem] leading-tight text-slate-950">Totais por pessoa</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700">
                {peopleReport?.people.length ?? 0}
              </span>
            </div>

            {peopleReport && peopleReport.people.length > 0 ? (
              <div className="grid gap-4">
                {peopleReport.people.map((item) => (
                  <article
                    className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                    key={item.personId}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={eyebrowClass}>Pessoa {formatId(item.personId)}</p>
                        <h3 className="font-display mt-2 text-[1.35rem] leading-tight text-slate-950">
                          {item.personName}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{item.age} anos</p>
                      </div>
                      <div className="text-right">
                        <span className={eyebrowClass}>Saldo</span>
                        <strong className="font-display mt-2 block text-[1.5rem] leading-none text-slate-950">
                          {formatCurrency(item.balance)}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MetaTile label="Receitas" tone="teal" value={formatCurrency(item.totalIncome)} />
                      <MetaTile label="Despesas" tone="amber" value={formatCurrency(item.totalExpense)} />
                    </div>
                  </article>
                ))}
                <article className="rounded-[30px] border border-slate-950 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-5 text-white shadow-[0_18px_34px_rgba(15,23,42,0.30)]">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/60">Total geral</p>
                  <strong className="font-display mt-3 block text-[2rem] leading-none">
                    {formatCurrency(peopleReport.overall.balance)}
                  </strong>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetaTile
                      label="Receitas"
                      tone="teal"
                      value={formatCurrency(peopleReport.overall.totalIncome)}
                    />
                    <MetaTile
                      label="Despesas"
                      tone="amber"
                      value={formatCurrency(peopleReport.overall.totalExpense)}
                    />
                  </div>
                </article>
              </div>
            ) : (
              <EmptyState
                description="Os totais por pessoa aparecerão aqui assim que houver pessoas cadastradas."
                title="Nenhum dado para o relatório"
              />
            )}
          </article>

          <article className={sectionPanelClass}>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.9rem] leading-tight text-slate-950">
                  Totais por categoria
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700">
                {categoryReport?.categories.length ?? 0}
              </span>
            </div>

            {categoryReport && categoryReport.categories.length > 0 ? (
              <div className="grid gap-4">
                {categoryReport.categories.map((item) => (
                  <article
                    className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                    key={item.categoryId}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={eyebrowClass}>Categoria {formatId(item.categoryId)}</p>
                        <h3 className="font-display mt-2 text-[1.35rem] leading-tight text-slate-950">
                          {item.categoryDescription}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{translatePurpose(item.purpose)}</p>
                      </div>
                      <div className="text-right">
                        <span className={eyebrowClass}>Saldo</span>
                        <strong className="font-display mt-2 block text-[1.5rem] leading-none text-slate-950">
                          {formatCurrency(item.balance)}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MetaTile label="Receitas" tone="teal" value={formatCurrency(item.totalIncome)} />
                      <MetaTile label="Despesas" tone="amber" value={formatCurrency(item.totalExpense)} />
                    </div>
                  </article>
                ))}
                <article className="rounded-[30px] border border-slate-950 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-5 text-white shadow-[0_18px_34px_rgba(15,23,42,0.30)]">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/60">Total geral</p>
                  <strong className="font-display mt-3 block text-[2rem] leading-none">
                    {formatCurrency(categoryReport.overall.balance)}
                  </strong>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetaTile
                      label="Receitas"
                      tone="teal"
                      value={formatCurrency(categoryReport.overall.totalIncome)}
                    />
                    <MetaTile
                      label="Despesas"
                      tone="amber"
                      value={formatCurrency(categoryReport.overall.totalExpense)}
                    />
                  </div>
                </article>
              </div>
            ) : (
              <EmptyState
                description="Os totais por categoria entram em cena assim que houver categorias cadastradas."
                title="Nenhum dado para o relatório"
              />
            )}
          </article>
        </section>
      </main>
    );
  }

  return (
    <div className="brand-page relative min-h-screen overflow-hidden">
      <div className="floating-orb absolute left-[-5rem] top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_55%,transparent_72%)] blur-3xl" />
      <div className="floating-orb floating-orb--slow absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16),rgba(245,158,11,0.04)_58%,transparent_72%)] blur-3xl" />
      <div className="floating-orb absolute bottom-[-7rem] left-[24%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_56%,transparent_72%)] blur-3xl" />

      {isMenuOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-[#0f172a]/48 backdrop-blur-[2px]"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        aria-label="Menu lateral"
        className={`fixed right-0 top-0 z-50 flex h-screen w-[min(88vw,320px)] flex-col border-l border-[rgba(255,255,255,0.18)] bg-[#12384d] px-4 py-5 shadow-[0_24px_60px_rgba(7,20,30,0.34)] transition duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        id="menu-lateral"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              alt="Logo do sistema"
              className="h-12 w-12 shrink-0"
              decoding="async"
              src="/logo-mark.svg"
            />
            <strong className="font-display text-lg leading-tight text-[#fffdf8]">Menu</strong>
          </div>
          <button
            aria-label="Fechar menu"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.10)] text-[#fffdf8] transition duration-200 hover:bg-[rgba(255,255,255,0.16)]"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.key;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={tabButtonClass(isActive)}
                key={item.key}
                onClick={() => handleSectionSelect(item.key)}
                type="button"
              >
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div
        className={`fixed inset-x-0 top-0 z-30 transition duration-300 ${hasScrolled ? "border-b border-[#c7931f]/14 bg-white/96 shadow-[0_14px_32px_rgba(7,20,30,0.14)] backdrop-blur-sm" : "bg-transparent"}`}
      >
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <img
            alt="Logo do sistema"
            className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
            decoding="async"
            src="/logo-mark.svg"
          />

          <button
            aria-controls="menu-lateral"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu"
            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1.5 bg-transparent transition duration-200 ${hasScrolled ? "text-[#12384d]" : "text-[#fffdf8]"}`}
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <span className="h-0.5 w-6 rounded-full bg-current" />
            <span className="h-0.5 w-6 rounded-full bg-current" />
            <span className="h-0.5 w-6 rounded-full bg-current" />
          </button>
        </div>
      </div>

      <div className="app-shell relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-4 px-4 pb-5 pt-28 sm:px-6 sm:pb-6 sm:pt-32 lg:px-8 lg:pb-8 lg:pt-36">
        <header className="grid gap-4 md:gap-5 lg:gap-6">
          <section className={`${shellPanelClass} p-6 sm:p-8`}>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.46),rgba(255,255,255,0.10))]" />
            <div className="relative flex justify-center text-center">
              <h1 className="font-display max-w-4xl text-[clamp(1.8rem,4vw,3.4rem)] leading-[1] tracking-[-0.05em] text-slate-950">
                Controle de Gastos Residenciais
              </h1>
            </div>
          </section>
        </header>

        {errorMessage ? (
          <p className="rounded-[24px] border border-amber-200 bg-white/96 px-4 py-3 text-sm font-medium text-amber-900 shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
            {errorMessage}
          </p>
        ) : null}

        {loading ? (
          <section className={`${sectionPanelClass} animate-pulse`}>
            <div className="grid gap-3">
              <div className="h-5 w-28 rounded-full bg-slate-200/80" />
              <div className="h-12 max-w-2xl rounded-[20px] bg-slate-200/80" />
              <div className="h-28 rounded-[26px] bg-slate-100/90" />
            </div>
          </section>
        ) : null}

        {!loading && activeSection === "people" ? renderPeopleSection() : null}
        {!loading && activeSection === "categories" ? renderCategoriesSection() : null}
        {!loading && activeSection === "transactions" ? renderTransactionsSection() : null}
        {!loading && activeSection === "reports" ? renderReportsSection() : null}
      </div>
    </div>
  );
}
