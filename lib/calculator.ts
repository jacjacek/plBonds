import type { Bond } from "./bonds"

export const MAX_INVESTMENT = 1_000_000_000
const NOMINAL_CENTS = 10_000

export interface CalculationInput {
  investment: number
  months: number
  inflation: number
  nbpRate: number
  autoReinvest: boolean
  purchaseDate: string
}

export interface PurchaseRound {
  startMonth: number
  endMonth: number
  completed: boolean
  bondCount: number
  capitalStart: number
  capitalEnd: number
}

export interface CalculationResult {
  totalValue: number
  profit: number
  grossInterest: number
  tax: number
  fees: number
  initialBondCount: number
  initialCash: number
  familyReinvestmentSkipped: boolean
  purchaseRounds: PurchaseRound[]
}

// UTC dates avoid daylight-saving changes. Clamp anniversaries to the end of a month.
export function addMonths(date: Date, months: number): Date {
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0))
  return new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(date.getUTCDate(), last.getUTCDate())))
}

// All paid amounts are integer grosze. Coupon interest is rounded per bond,
// withholding tax is rounded UP once per payment of the purchased batch.
function settle(grossPerBond: number, feePerBond: number, count: number) {
  const gross = grossPerBond * count
  const fees = feePerBond * count
  const taxable = Math.max(0, gross - fees)
  const tax = Math.ceil(taxable * 19 / 100)
  return { gross, fees, tax, net: gross - fees - tax }
}

function roundReturn(bond: Bond, count: number, months: number, date: Date, input: CalculationInput) {
  const early = months < bond.maturityMonths
  let gross = 0
  let fees = 0
  let tax = 0
  const pay = (interest: number, fee: number, capFee: boolean) => {
    const interestCents = Math.max(0, Math.round(interest * 100 + 1e-8))
    const feeCents = Math.round(fee * 100)
    const payment = settle(interestCents, capFee ? Math.min(feeCents, interestCents) : feeCents, count)
    gross += payment.gross
    fees += payment.fees
    tax += payment.tax
  }

  if (bond.loseInterestOnEarlyWithdrawal) {
    if (!early) pay(100 * bond.interestRate / 100 * bond.maturityMonths / 12, 0, true)
  } else if (bond.basedOnNBP) {
    // The last coupon is settled with redemption. Earlier coupons stay in cash.
    for (let month = 0; month < months; month++) {
      const rate = month === 0 ? bond.interestRate : Math.max(0, input.nbpRate) + bond.margin
      pay(rate / 12, early && month === months - 1 ? bond.penalty : 0, month === 0)
    }
  } else {
    // A horizon at the annual boundary ends the preceding interest period.
    const finalYear = Math.floor((months - 1) / 12)
    const rate = (year: number) => (bond.basedOnInflation && year > 0
      ? Math.max(0, input.inflation) + bond.margin : bond.interestRate) / 100
    let base = 100
    for (let year = 0; year < finalYear; year++) {
      if (bond.compound) base *= 1 + rate(year)
      else pay(100 * rate(year), 0, true)
    }
    const periodStart = addMonths(date, finalYear * 12)
    const periodEnd = addMonths(date, (finalYear + 1) * 12)
    const elapsed = addMonths(date, months)
    const fraction = (elapsed.getTime() - periodStart.getTime()) / (periodEnd.getTime() - periodStart.getTime())
    // TOS uses the rounded previous anniversary value for early redemption;
    // its maturity payment and inflation-linked bonds use the full product.
    if (bond.compound && bond.name === "TOS" && early) base = Math.round(base * 100 + 1e-8) / 100
    const interest = bond.compound ? base * (1 + rate(finalYear) * fraction) - 100 : 100 * rate(finalYear) * fraction
    pay(interest, early ? bond.penalty : 0, bond.compound || finalYear === 0)
  }
  return { gross, fees, tax, net: gross - fees - tax }
}

export function calculateReturn(bond: Bond, input: CalculationInput): CalculationResult {
  const { investment, months, inflation, nbpRate, autoReinvest, purchaseDate } = input
  const date = new Date(`${purchaseDate}T00:00:00.000Z`)
  if (!Number.isFinite(investment) || investment < 0 || investment > MAX_INVESTMENT ||
    !Number.isInteger(months) || months < 0 || months > 144 ||
    !Number.isFinite(inflation) || inflation < -20 || inflation > 100 ||
    !Number.isFinite(nbpRate) || nbpRate < 0 || nbpRate > 100 ||
    !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== purchaseDate) {
    throw new RangeError("Nieprawidłowe parametry symulacji")
  }
  const investmentCents = Math.round(investment * 100)
  let capital = investmentCents
  let currentMonth = 0
  let gross = 0
  let fees = 0
  let tax = 0
  const purchaseRounds: PurchaseRound[] = []
  while (currentMonth < months) {
    const count = Math.floor(capital / NOMINAL_CENTS)
    if (count === 0) break
    const roundMonths = Math.min(months - currentMonth, bond.maturityMonths)
    const round = roundReturn(bond, count, roundMonths, addMonths(date, currentMonth), input)
    const startCapital = capital
    capital += round.net
    gross += round.gross
    fees += round.fees
    tax += round.tax
    purchaseRounds.push({
      startMonth: currentMonth, endMonth: currentMonth + roundMonths,
      completed: roundMonths === bond.maturityMonths, bondCount: count,
      capitalStart: startCapital / 100, capitalEnd: capital / 100,
    })
    currentMonth += roundMonths
    // Family bonds require a fresh benefit allowance. Never assume it exists.
    if (!autoReinvest || bond.familyOnly) break
  }
  return {
    totalValue: capital / 100, profit: (capital - investmentCents) / 100,
    grossInterest: gross / 100, tax: tax / 100, fees: fees / 100,
    initialBondCount: Math.floor(investmentCents / NOMINAL_CENTS),
    initialCash: (investmentCents % NOMINAL_CENTS) / 100,
    familyReinvestmentSkipped: autoReinvest && bond.familyOnly && months > bond.maturityMonths,
    purchaseRounds,
  }
}
