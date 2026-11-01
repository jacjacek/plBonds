import data from "../data/bonds.json"

export interface Bond {
  name: string
  series: string
  type: string
  displayName: string
  interestRate: number
  maturityMonths: number
  variableRate: boolean
  penalty: number
  interestPayment: string
  compound: boolean
  margin: number
  basedOnNBP?: boolean
  basedOnInflation?: boolean
  loseInterestOnEarlyWithdrawal?: boolean
  purchasePrice: number
  exchangePrice: number | null
  advantages: string
  typeLabel: string
  interestDetails: string
  interestPeriod: string
  withdrawalFee: string
  withdrawalConditions: string
  earlyWithdrawalPossible: boolean
  detailsUrl: string
  buyUrl: string
  familyOnly: boolean
  emissionLetterUrl?: string
}

export const OFFER = data.offer
export const BONDS: readonly Bond[] = data.bonds

export function isOfferCurrent(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit",
  }).formatToParts(now)
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}` === OFFER.month
}
