/** ISO 4217 codes allowed for itinerary budgets (admin + validation). */
export const BUDGET_CURRENCIES = [
  "USD",
  "EUR",
  "JPY",
  "GBP",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "KRW",
  "INR",
  "MXN",
  "BRL",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "THB",
  "SGD",
  "HKD",
] as const;

export type BudgetCurrencyCode = (typeof BUDGET_CURRENCIES)[number];

export function isBudgetCurrency(code: string): code is BudgetCurrencyCode {
  return (BUDGET_CURRENCIES as readonly string[]).includes(code);
}
