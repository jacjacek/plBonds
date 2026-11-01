"use client"

import { useState, useMemo } from "react"
import type React from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const TAX_RATE = 0.19
const BOND_NOMINAL_VALUE = 100

interface Bond {
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
  exchangePrice: number | string
  advantages: string
  typeLabel: string
  interestDetails: string
  interestPeriod: string
  withdrawalFee: string
  withdrawalConditions: string
  earlyWithdrawalPossible: boolean
  detailsUrl: string
  buyUrl: string
}

interface PurchaseRound {
  startMonth: number
  endMonth: number
  completed: boolean
  capitalStart?: number
  capitalEnd?: number
}

interface CalculationResult {
  totalValue: number
  profit: number
  effectiveRate: number
  purchaseRounds: PurchaseRound[]
}

const bondTone = (bond: Pick<Bond, "name" | "typeLabel">) => {
  if (bond.typeLabel === "STAŁOPROCENTOWE") return { text: "text-bond-fixed", dot: "bg-bond-fixed" }
  if (bond.typeLabel === "ZMIENNOPROCENTOWE") return { text: "text-bond-variable", dot: "bg-bond-variable" }
  if (bond.name === "ROS" || bond.name === "ROD") return { text: "text-bond-family", dot: "bg-bond-family" }
  return { text: "text-bond-indexed", dot: "bg-bond-indexed" }
}

const DotGrid = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    {Array.from({ length: 36 }, (_, i) => (
      <circle key={i} cx={10 + (i % 6) * 20} cy={10 + Math.floor(i / 6) * 20} r="1.75" fill="#4578EE" opacity="0.55" />
    ))}
  </svg>
)

const HeroMotif = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 220 170" className={className} aria-hidden="true">
    {Array.from({ length: 30 }, (_, i) => (
      <circle
        key={i}
        cx={118 + (i % 6) * 18}
        cy={68 + Math.floor(i / 6) * 18}
        r="1.75"
        fill="#4578EE"
        opacity="0.55"
      />
    ))}
    <rect x="6" y="8" width="24" height="24" fill="#4578EE" opacity="0.55" />
    <rect x="150" y="0" width="40" height="40" fill="#0033CC" />
    <rect x="0" y="108" width="58" height="30" fill="#FF0921" opacity="0.85" />
    {[24, 62, 100].map((y) => (
      <g key={y}>
        <rect x="26" y={y} width="170" height="24" fill="#F0F0EB" opacity="0.08" />
        <path
          d={`M34 ${y + 6}l12 12m0-12l-12 12`}
          stroke="#DDEC61"
          strokeWidth="2.5"
          strokeLinecap="square"
          fill="none"
        />
      </g>
    ))}
  </svg>
)

const BondsCalculator = () => {
  const [monthsToWithdraw, setMonthsToWithdraw] = useState(12)
  const [inflation, setInflation] = useState(4.5)
  const [nbpRate, setNbpRate] = useState(5.75)
  const [autoReinvest, setAutoReinvest] = useState(false)
  const [excludeFamilyBonds, setExcludeFamilyBonds] = useState(false)
  const [expandedBond, setExpandedBond] = useState<string | null>(null)
  const [investment, setInvestment] = useState(100000)

  // Helpers for robust numeric inputs (support comma/dot, preserve mid-typing)
  const normalizeDecimal = (value: string): string => value.replace(/\s+/g, "").replace(",", ".")
  const isPartialNumeric = (value: string): boolean => /^[0-9]*([,.][0-9]*)?$/.test(value)

  const handleEnterBlur = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // Raw input strings to avoid jumping to 0 during typing
  const [investmentRaw, setInvestmentRaw] = useState<string>(String(investment))
  const [inflationRaw, setInflationRaw] = useState<string>(String(inflation).replace(".", ","))
  const [nbpRateRaw, setNbpRateRaw] = useState<string>(String(nbpRate).replace(".", ","))

  const bonds: Bond[] = [
    {
      name: "OTS",
      series: "OTS0126",
      displayName: "Obligacje 3-miesięczne OTS",
      type: "3-miesięczne",
      typeLabel: "STAŁOPROCENTOWE",
      interestRate: 2.75,
      maturityMonths: 3,
      variableRate: false,
      penalty: 0,
      loseInterestOnEarlyWithdrawal: true,
      interestPayment: "at_end",
      compound: false,
      margin: 0,
      purchasePrice: 100.0,
      exchangePrice: 100.0,
      advantages: "Zysk określony z góry, nabywca zna wysokość odsetek w dniu zakupu",
      interestDetails: "0,69 zł",
      interestPeriod: "01.09.2025-01.12.2025",
      withdrawalFee: "brak",
      withdrawalConditions: "3 miesiące od dnia zakupu",
      earlyWithdrawalPossible: false,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-3-miesieczne-ots/ots0126/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-3-miesieczne-ots/ots0126/"
    },
    {
      name: "ROR",
      series: "ROR1026",
      displayName: "Obligacje roczne ROR",
      type: "roczne",
      typeLabel: "ZMIENNOPROCENTOWE",
      interestRate: 4.75,
      maturityMonths: 12,
      variableRate: true,
      basedOnNBP: true,
      penalty: 0.5,
      margin: 0.0,
      interestPayment: "monthly",
      compound: false,
      purchasePrice: 100.0,
      exchangePrice: 99.9,
      advantages: "Regularny (co miesiąc) dopływ gotówki z wypłat odsetek",
      interestDetails: "Naliczane od wartości nominalnej, wypłacane miesięcznie",
      interestPeriod: "01.10.2025 - 30.11.2025",
      withdrawalFee: "50 gr",
      withdrawalConditions: "Rok od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-roczne-ror/ror102/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-roczne-ror/ror102/"
    },
    {
      name: "DOR",
      series: "DOR1027",
      displayName: "Obligacje 2-letnie DOR",
      type: "2-letnie",
      typeLabel: "ZMIENNOPROCENTOWE",
      interestRate: 4.9,
      maturityMonths: 24,
      variableRate: true,
      basedOnNBP: true,
      penalty: 0.7,
      margin: 0.15,
      interestPayment: "monthly",
      compound: false,
      purchasePrice: 100.0,
      exchangePrice: 99.9,
      advantages: "Regularny (co miesiąc) dopływ gotówki z wypłat odsetek",
      interestDetails: "Naliczane od wartości nominalnej, wypłacane miesięcznie",
      interestPeriod: "01.10.2025 - 30.11.2025",
      withdrawalFee: "70 gr",
      withdrawalConditions: "Dwa lata od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-2-letnie-dor/dor1027/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-2-letnie-dor/dor1027/"
    },
    {
      name: "TOS",
      series: "TOS1028",
      displayName: "Obligacje 3-letnie TOS",
      type: "3-letnie",
      typeLabel: "STAŁOPROCENTOWE",
      interestRate: 5.15,
      maturityMonths: 36,
      variableRate: false,
      penalty: 1.0,
      interestPayment: "at_end",
      compound: true,
      margin: 0,
      purchasePrice: 100.0,
      exchangePrice: 99.9,
      advantages: "Klient wie, jakie odsetki otrzyma po trzech latach",
      interestDetails: "Naliczane od wartości nominalnej, kapitalizowane rocznie, wypłacane w dniu wykupu",
      interestPeriod: "01.10.2025 - 01.10.2028",
      withdrawalFee: "1 zł",
      withdrawalConditions: "Trzy lata od dnia zakupu",
      earlyWithdrawalPossible: false,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-3-letnie-tos/tos1028/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-3-letnie-tos/tos1028/"
    },
    {
      name: "COI",
      series: "COI1029",
      displayName: "Obligacje 4-letnie COI",
      type: "4-letnie",
      typeLabel: "INDEKSOWANE INFLACJĄ",
      interestRate: 5.5,
      maturityMonths: 48,
      variableRate: true,
      basedOnInflation: true,
      penalty: 2.0,
      margin: 1.5,
      interestPayment: "yearly",
      compound: false,
      purchasePrice: 100.0,
      exchangePrice: "-",
      advantages: "Stała marża – od drugiego okresu indeksowane inflacją",
      interestDetails: "Naliczane od wartości nominalnej, wypłacane rocznie",
      interestPeriod: "01.10.2025 - 01.10.2026",
      withdrawalFee: "2 zł",
      withdrawalConditions: "Cztery lata od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-4-letnie-coi/coi1029/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-4-letnie-coi/coi1029/"
    },
    {
      name: "ROS",
      series: "ROS1031",
      displayName: "Obligacje 6-letnie ROS",
      type: "6-letnie",
      typeLabel: "INDEKSOWANE INFLACJĄ",
      interestRate: 5.7,
      maturityMonths: 72,
      variableRate: true,
      basedOnInflation: true,
      penalty: 2.0,
      margin: 1.75,
      interestPayment: "at_end",
      compound: true,
      purchasePrice: 100.0,
      exchangePrice: "-",
      advantages:
        "Preferencyjne oprocentowanie, stała marża, od drugiego okresu indeksowane inflacją, coroczna kapitalizacja",
      interestDetails: "Naliczane od wartości nominalnej, kapitalizowane rocznie",
      interestPeriod: "01.10.2025 - 01.10.2026",
      withdrawalFee: "2 zł",
      withdrawalConditions: "Sześć lat od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-6-letnie-ros/ros1031/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-6-letnie-ros/ros1031/"
    },
    {
      name: "EDO",
      series: "EDO1035",
      displayName: "Obligacje 10-letnie EDO",
      type: "10-letnie",
      typeLabel: "INDEKSOWANE INFLACJĄ",
      interestRate: 6.0,
      maturityMonths: 120,
      variableRate: true,
      basedOnInflation: true,
      penalty: 3.0,
      margin: 2.0,
      interestPayment: "at_end",
      compound: true,
      purchasePrice: 100.0,
      exchangePrice: 99.9,
      advantages:
        "Stała marża – od drugiego okresu indeksowane inflacją, coroczna kapitalizacja znacznie zwiększa zyskowność",
      interestDetails: "Naliczane od wartości nominalnej, kapitalizowane rocznie",
      interestPeriod: "01.10.2025 - 01.10.2026",
      withdrawalFee: "3 zł",
      withdrawalConditions: "Dziesięć lat od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-10-letnie-edo/edo1035/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-10-letnie-edo/edo1035/"
    },
    {
      name: "ROD",
      series: "ROD1037",
      displayName: "Obligacje 12-letnie ROD",
      type: "12-letnie",
      typeLabel: "INDEKSOWANE INFLACJĄ",
      interestRate: 6.25,
      maturityMonths: 144,
      variableRate: true,
      basedOnInflation: true,
      penalty: 3.0,
      margin: 2.25,
      interestPayment: "at_end",
      compound: true,
      purchasePrice: 100.0,
      exchangePrice: "-",
      advantages:
        "Preferencyjne oprocentowanie, stała marża, od drugiego okresu indeksowane inflacją, coroczna kapitalizacja znacznie zwiększa zyskowność",
      interestDetails: "Naliczane od wartości nominalnej, kapitalizowane rocznie",
      interestPeriod: "01.10.2025 - 01.10.2026",
      withdrawalFee: "3 zł",
      withdrawalConditions: "Dwanaście lat od dnia zakupu",
      earlyWithdrawalPossible: true,
      detailsUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-12-letnie-rod/rod1037/",
      buyUrl: "https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-12-letnie-rod/rod1037/"
    },
  ]

  const calculateReturn = (bond: Bond): CalculationResult => {
    const numberOfBonds = investment / BOND_NOMINAL_VALUE
    let totalValue = investment
    let totalInterest = 0
    let purchaseRounds: PurchaseRound[] = []

    if (monthsToWithdraw < 1) {
      return { totalValue: investment, profit: 0, effectiveRate: 0, purchaseRounds: [] }
    }

    if (!autoReinvest) {
      const effectiveMonths = Math.min(monthsToWithdraw, bond.maturityMonths)

      if (bond.loseInterestOnEarlyWithdrawal && effectiveMonths < bond.maturityMonths) {
        return {
          totalValue: investment,
          profit: 0,
          effectiveRate: 0,
          purchaseRounds: [{ startMonth: 0, endMonth: effectiveMonths, completed: false }],
        }
      }

      if (bond.basedOnNBP) {
        const monthlyRate = (nbpRate + bond.margin) / 12 / 100
        totalInterest = investment * monthlyRate * effectiveMonths
        purchaseRounds = [
          { startMonth: 0, endMonth: effectiveMonths, completed: effectiveMonths >= bond.maturityMonths },
        ]
      } else if (bond.basedOnInflation) {
        const years = effectiveMonths / 12
        const fullYears = Math.floor(years)
        const remainingMonths = (years - fullYears) * 12

        let currentValue = investment

        if (years >= 1) {
          const firstYearRate = bond.interestRate / 100
          if (bond.compound) {
            currentValue = currentValue * (1 + firstYearRate)
            totalInterest += investment * firstYearRate
          } else {
            totalInterest += investment * firstYearRate
          }
        } else {
          const firstYearRate = bond.interestRate / 100
          const partialYearInterest = investment * firstYearRate * years
          totalInterest += partialYearInterest
          if (bond.compound) {
            currentValue = investment + partialYearInterest
          }
        }

        if (fullYears > 1) {
          const yearlyRate = (inflation + bond.margin) / 100
          for (let i = 1; i < fullYears; i++) {
            if (bond.compound) {
              const yearInterest = currentValue * yearlyRate
              currentValue += yearInterest
              totalInterest += yearInterest
            } else {
              totalInterest += investment * yearlyRate
            }
          }
        }

        if (remainingMonths > 0 && fullYears >= 1) {
          const yearlyRate = (inflation + bond.margin) / 100
          if (bond.compound) {
            const partialYearInterest = currentValue * yearlyRate * (remainingMonths / 12)
            currentValue += partialYearInterest
            totalInterest += partialYearInterest
          } else {
            const partialYearInterest = investment * yearlyRate * (remainingMonths / 12)
            totalInterest += partialYearInterest
          }
        }

        if (bond.compound) {
          totalValue = currentValue
        } else {
          totalValue = investment + totalInterest
        }

        purchaseRounds = [
          {
            startMonth: 0,
            endMonth: effectiveMonths,
            completed: effectiveMonths >= bond.maturityMonths,
          },
        ]
      } else if (bond.compound) {
        const years = effectiveMonths / 12
        const fullYears = Math.floor(years)
        let currentValue = investment

        for (let i = 0; i < fullYears; i++) {
          currentValue = currentValue * (1 + bond.interestRate / 100)
        }

        const remainingMonths = (years - fullYears) * 12
        if (remainingMonths > 0 && fullYears < bond.maturityMonths / 12) {
          const partialYearInterest = currentValue * (bond.interestRate / 100) * (remainingMonths / 12)
          currentValue += partialYearInterest
        }

        totalValue = currentValue
        totalInterest = totalValue - investment
        purchaseRounds = [
          {
            startMonth: 0,
            endMonth: effectiveMonths,
            completed: effectiveMonths >= bond.maturityMonths,
          },
        ]
      } else {
        const rate = bond.interestRate / 100
        const years = effectiveMonths / 12
        totalInterest = investment * rate * years
        purchaseRounds = [
          {
            startMonth: 0,
            endMonth: effectiveMonths,
            completed: effectiveMonths >= bond.maturityMonths,
          },
        ]
      }

      const tax = totalInterest * TAX_RATE
      const netInterest = totalInterest - tax

      let penalty = 0
      if (effectiveMonths < bond.maturityMonths && bond.penalty > 0) {
        penalty = numberOfBonds * bond.penalty
      }

      totalValue = investment + netInterest - penalty
      const profit = totalValue - investment
      const effectiveRate = monthsToWithdraw > 0 ? (profit / investment) * 100 * (12 / monthsToWithdraw) : 0

      return { totalValue, profit, effectiveRate, purchaseRounds }
    } else {
      let currentCapital = investment
      let monthsRemaining = monthsToWithdraw
      let currentMonth = 0
      purchaseRounds = []

      while (monthsRemaining > 0) {
        const roundMonths = Math.min(monthsRemaining, bond.maturityMonths)
        const isPartialRound = roundMonths < bond.maturityMonths

        let roundInterest = 0
        let roundValue = currentCapital

        if (bond.basedOnNBP) {
          const monthlyRate = (nbpRate + bond.margin) / 12 / 100
          roundInterest = currentCapital * monthlyRate * roundMonths
        } else if (bond.compound) {
          const years = roundMonths / 12
          const fullYears = Math.floor(years)
          let tempValue = currentCapital

          for (let i = 0; i < fullYears; i++) {
            tempValue = tempValue * (1 + bond.interestRate / 100)
          }

          const remainingMonths = (years - fullYears) * 12
          if (remainingMonths > 0 && fullYears < bond.maturityMonths / 12) {
            const partialYearInterest = tempValue * (bond.interestRate / 100) * (remainingMonths / 12)
            tempValue += partialYearInterest
          }

          roundValue = tempValue
          roundInterest = roundValue - currentCapital
        } else {
          const rate = bond.interestRate / 100
          const years = roundMonths / 12
          roundInterest = currentCapital * rate * years
        }

        const roundTax = roundInterest * TAX_RATE
        let roundNetInterest = roundInterest - roundTax

        let roundPenalty = 0
        if (isPartialRound && bond.penalty > 0) {
          const bondsInRound = currentCapital / BOND_NOMINAL_VALUE
          roundPenalty = bondsInRound * bond.penalty
        }

        if (bond.loseInterestOnEarlyWithdrawal && isPartialRound) {
          roundNetInterest = 0
        }

        const roundFinalValue = currentCapital + roundNetInterest - roundPenalty
        totalInterest += roundNetInterest

        purchaseRounds.push({
          startMonth: currentMonth,
          endMonth: currentMonth + roundMonths,
          completed: !isPartialRound,
          capitalStart: currentCapital,
          capitalEnd: roundFinalValue,
        })

        currentCapital = roundFinalValue
        monthsRemaining -= roundMonths
        currentMonth += roundMonths
      }

      totalValue = currentCapital
      const profit = totalValue - investment
      const effectiveRate = monthsToWithdraw > 0 ? (profit / investment) * 100 * (12 / monthsToWithdraw) : 0

      return { totalValue, profit, effectiveRate, purchaseRounds }
    }
  }

  const results = useMemo(() => {
    const filteredBonds = excludeFamilyBonds
      ? bonds.filter((bond) => bond.name !== "ROD" && bond.name !== "ROS")
      : bonds

    return filteredBonds
      .map((bond) => ({
        ...bond,
        ...calculateReturn(bond),
      }))
      .sort((a, b) => b.profit - a.profit)
  }, [investment, monthsToWithdraw, inflation, nbpRate, autoReinvest, excludeFamilyBonds])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDecimal = (value: number): string => value.toFixed(2).replace(".", ",")

  const bestBond = results[0]
  const cellClass = "border-b border-border p-4 h-20 flex items-center"
  const labelClass = "text-sm font-medium text-muted-foreground"
  const panelClass = "rounded-[20px] border border-border bg-card"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-10 bg-gradient-to-b from-bond-variable/40 to-[#0033CC]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium leading-tight">
              Obligacje
              <br />
              Skarbowe
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#kalkulator" className="hidden sm:block hover:text-muted-foreground transition-colors">
            Kalkulator
          </a>
          <a href="#tabela" className="hidden sm:block hover:text-muted-foreground transition-colors">
            Porównanie
          </a>
          <a
            href="https://www.obligacjeskarbowe.pl/oferta/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-9 px-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Oficjalna oferta
          </a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16 space-y-6">
        <section className="relative pt-12 pb-16 md:pt-24 md:pb-24 text-center">
          <HeroMotif className="hidden xl:block absolute left-0 top-16 w-52 -scale-x-100" />
          <HeroMotif className="hidden xl:block absolute right-0 top-16 w-52" />
          <h1 className="font-serif font-light text-5xl md:text-7xl lg:text-[84px] leading-[0.95] tracking-[-0.04em]">
            Tabela porównawcza
          </h1>
          <p className="mt-6 text-lg leading-snug tracking-tight text-muted-foreground max-w-2xl mx-auto">
            Obligacje skarbowe – oprocentowanie, rodzaje. Zastanawiasz się, jakie wybrać? Poznaj rodzaje obligacji
            skarbowych. Porównaj aktualną ofertę obligacji Skarbu Państwa i wybierz najlepszy dla siebie wariant
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <a
              href="#kalkulator"
              className="inline-flex items-center h-12 px-6 rounded-[20px] bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Policz zysk
            </a>
            <a
              href="#tabela"
              className="inline-flex items-center h-12 px-6 rounded-[20px] bg-secondary text-sm font-medium hover:bg-secondary/70 transition-colors"
            >
              Porównaj obligacje
            </a>
          </div>
        </section>

        <section id="kalkulator" className="scroll-mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${panelClass} lg:col-span-2 p-6 md:p-8 space-y-8`}>
            <div className="space-y-2">
              <Label htmlFor="investment" className={labelClass}>
                Kwota inwestycji (PLN)
              </Label>
              <Input
                id="investment"
                type="text"
                inputMode="decimal"
                value={investmentRaw}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === "" || isPartialNumeric(raw)) {
                    setInvestmentRaw(raw)
                  }
                }}
                onKeyDown={handleEnterBlur}
                onBlur={() => {
                  const normalized = normalizeDecimal(investmentRaw)
                  const parsed = Number.parseFloat(normalized)
                  if (Number.isFinite(parsed)) {
                    const clamped = Math.max(100, parsed)
                    setInvestment(clamped)
                    setInvestmentRaw(String(clamped).replace(".", ","))
                  } else {
                    setInvestmentRaw(String(investment).replace(".", ","))
                  }
                }}
                className="h-16 rounded-lg px-4 font-serif text-4xl md:text-4xl tracking-tight"
              />
              <p className="text-xs text-muted-foreground">Minimalna kwota: 100 PLN</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>Okres inwestycji</Label>
                <span className="text-sm font-medium tabular-nums">
                  {monthsToWithdraw}{" "}
                  {monthsToWithdraw === 1 ? "miesiąc" : monthsToWithdraw < 5 ? "miesiące" : "miesięcy"}
                </span>
              </div>
              <Slider
                value={[monthsToWithdraw]}
                onValueChange={(value) => setMonthsToWithdraw(value[0])}
                min={1}
                max={144}
                step={1}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inflation" className={labelClass}>
                  Inflacja roczna (%)
                </Label>
                <Input
                  id="inflation"
                  type="text"
                  inputMode="decimal"
                  value={inflationRaw}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "" || isPartialNumeric(raw)) {
                      setInflationRaw(raw)
                    }
                  }}
                  onKeyDown={handleEnterBlur}
                  onBlur={() => {
                    const normalized = normalizeDecimal(inflationRaw)
                    const parsed = Number.parseFloat(normalized)
                    if (Number.isFinite(parsed)) {
                      setInflation(parsed)
                      setInflationRaw(String(parsed).replace(".", ","))
                    } else {
                      setInflationRaw(String(inflation).replace(".", ","))
                    }
                  }}
                  className="h-11 rounded-lg px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nbpRate" className={labelClass}>
                  Stopa referencyjna NBP (%)
                </Label>
                <Input
                  id="nbpRate"
                  type="text"
                  inputMode="decimal"
                  value={nbpRateRaw}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "" || isPartialNumeric(raw)) {
                      setNbpRateRaw(raw)
                    }
                  }}
                  onKeyDown={handleEnterBlur}
                  onBlur={() => {
                    const normalized = normalizeDecimal(nbpRateRaw)
                    const parsed = Number.parseFloat(normalized)
                    if (Number.isFinite(parsed)) {
                      setNbpRate(parsed)
                      setNbpRateRaw(String(parsed).replace(".", ","))
                    } else {
                      setNbpRateRaw(String(nbpRate).replace(".", ","))
                    }
                  }}
                  className="h-11 rounded-lg px-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary">
                <div>
                  <Label htmlFor="reinvest" className="text-sm font-medium cursor-pointer">
                    Automatyczne reinwestowanie
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">Kupuj kolejne emisje po wykupie</p>
                </div>
                <Switch id="reinvest" checked={autoReinvest} onCheckedChange={setAutoReinvest} />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary">
                <div>
                  <Label htmlFor="excludeFamily" className="text-sm font-medium cursor-pointer">
                    Wyklucz obligacje rodzinne (ROD, ROS)
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Obligacje ROD i ROS są dostępne tylko dla rodzin z dziećmi
                  </p>
                </div>
                <Switch id="excludeFamily" checked={excludeFamilyBonds} onCheckedChange={setExcludeFamilyBonds} />
              </div>
            </div>
          </div>

          <aside className={`${panelClass} relative overflow-hidden p-6 md:p-8 flex flex-col justify-between gap-10`}>
            <DotGrid className="absolute -right-6 -top-6 w-44 opacity-60" />
            <p className={`${labelClass} relative`}>Najwyższy zysk po {monthsToWithdraw} mies.</p>
            <div className="relative">
              <p className="font-serif font-light text-5xl tracking-tight text-primary leading-none tabular-nums">
                {formatCurrency(bestBond.profit)}
              </p>
              <p className="mt-4 text-sm font-medium">{bestBond.displayName}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`size-1.5 rounded-full ${bondTone(bestBond).dot}`} aria-hidden="true" />
                {bestBond.series} · {formatDecimal(bestBond.interestRate)}%
              </p>
            </div>
          </aside>
        </section>

        <section id="tabela" className={`${panelClass} scroll-mt-6 overflow-hidden`}>
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full">
              <div className="flex-shrink-0 w-36 md:w-52 md:sticky left-0 z-10 border-r border-border bg-card">
                <div className="h-[22rem] border-b border-border p-4 flex items-end">
                  <p className="font-serif text-2xl leading-tight tracking-tight">Porównaj obligacje</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Cena zakupu</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Odsetki</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Okres oprocentowania</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Cena zamiany</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Wcześniejszy wykup</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Opłata za wykup</p>
                </div>
                <div className={cellClass}>
                  <p className={labelClass}>Warunki wykupu</p>
                </div>
                <div className="border-b border-border p-4 h-36 flex items-center">
                  <p className={labelClass}>Zalety</p>
                </div>
                <div className="p-4 h-32 flex items-center">
                  <p className={labelClass}>Zakup</p>
                </div>
              </div>

              {results.map((bond, idx) => (
                <div
                  key={bond.name}
                  className={`flex-shrink-0 w-64 ${idx < results.length - 1 ? "border-r border-border" : ""}`}
                >
                  <div className="h-[22rem] border-b border-border p-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className={`flex items-center gap-2 text-[11px] font-medium tracking-wide ${bondTone(bond).text}`}>
                        <span className={`size-1.5 rounded-full ${bondTone(bond).dot}`} aria-hidden="true" />
                        {bond.typeLabel}
                      </p>
                      <div className="font-serif font-light text-6xl tracking-tight tabular-nums">
                        {formatDecimal(bond.interestRate)}%
                      </div>
                      <h3 className="text-base font-medium leading-tight">{bond.displayName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Seria: <span className="font-mono">{bond.series}</span>
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 ${idx === 0 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                    >
                      <p className={`text-xs mb-1 ${idx === 0 ? "" : "text-muted-foreground"}`}>
                        Zysk po {monthsToWithdraw} mies.
                      </p>
                      <p
                        className={`font-serif text-2xl tracking-tight tabular-nums ${
                          bond.profit < 0 ? "text-bond-fixed" : ""
                        }`}
                      >
                        {formatCurrency(bond.profit)}
                      </p>
                    </div>
                  </div>

                  <div className={cellClass}>
                    <p className="text-sm font-medium tabular-nums">{formatDecimal(bond.purchasePrice)} zł</p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-xs leading-relaxed">{bond.interestDetails}</p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-xs tabular-nums">{bond.interestPeriod}</p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-sm font-medium tabular-nums">
                      {typeof bond.exchangePrice === "number"
                        ? `${formatDecimal(bond.exchangePrice)} zł`
                        : bond.exchangePrice}
                    </p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-sm font-medium">{bond.earlyWithdrawalPossible ? "Tak" : "Nie"}</p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-sm">{bond.withdrawalFee}</p>
                  </div>

                  <div className={cellClass}>
                    <p className="text-xs">{bond.withdrawalConditions}</p>
                  </div>

                  <div className="border-b border-border p-4 h-36 flex items-center">
                    <p className="text-xs text-muted-foreground leading-relaxed">{bond.advantages}</p>
                  </div>

                  <div className="p-4 h-32 flex flex-col justify-center gap-2">
                    <a
                      href={bond.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center bg-[#0033CC] hover:bg-[#1F4FE0] text-white text-sm font-medium rounded-[20px] h-10 transition-colors"
                    >
                      Kup
                    </a>
                    <a
                      href={bond.detailsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      Szczegóły →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${panelClass} p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6`}>
          <h2 className="font-serif font-light text-3xl tracking-tight">Informacje dodatkowe</h2>
          <div className="lg:col-span-2 space-y-2 text-sm text-muted-foreground">
            <p>• Wszystkie obliczenia uwzględniają podatek Belki (19%)</p>
            <p>• Inwestycja bazowa: {formatCurrency(investment)}</p>
            <p>
              • Obligacje zmiennoprocentowe (ROR, DOR) dostosowują się do stopy referencyjnej NBP (obecnie{" "}
              {formatDecimal(nbpRate)}%)
            </p>
            <p>
              • Obligacje indeksowane inflacją (COI, ROS, EDO, ROD) chronią przed inflacją (założona: {String(inflation).replace(".", ",")}%)
            </p>
            {autoReinvest && (
              <p className="font-medium text-foreground">
                • Z włączonym reinwestowaniem, po wykupie obligacji całość kapitału jest automatycznie inwestowana w
                kolejną emisję
              </p>
            )}
            {excludeFamilyBonds && (
              <p className="font-medium text-foreground">• Obligacje rodzinne (ROD, ROS) zostały wyłączone z obliczeń</p>
            )}
          </div>
        </section>

        <footer className="pt-4 text-xs text-muted-foreground">
          Niezależny kalkulator – nie jest oficjalnym serwisem Ministerstwa Finansów.
        </footer>
      </main>
    </div>
  )
}

export default BondsCalculator
