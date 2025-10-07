"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

const BondsCalculator = () => {
  const [monthsToWithdraw, setMonthsToWithdraw] = useState(12)
  const [inflation, setInflation] = useState(4.5)
  const [nbpRate, setNbpRate] = useState(5.75)
  const [autoReinvest, setAutoReinvest] = useState(false)
  const [excludeFamilyBonds, setExcludeFamilyBonds] = useState(false)
  const [expandedBond, setExpandedBond] = useState<string | null>(null)
  const [investment, setInvestment] = useState(100000)

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
  }, [monthsToWithdraw, inflation, nbpRate, autoReinvest, excludeFamilyBonds])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0033CC] flex items-center justify-center text-white font-bold text-xl">
              OS
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Obligacje Skarbowe</h1>
              <p className="text-sm text-gray-600">Kalkulator porównawczy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-gray-900">Tabela porównawcza</h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            Obligacje skarbowe – oprocentowanie, rodzaje. Zastanawiasz się, jakie wybrać? Poznaj rodzaje obligacji
            skarbowych. Porównaj aktualną ofertę obligacji Skarbu Państwa i wybierz najlepszy dla siebie wariant
          </p>
        </div>

        <Card className="border shadow-sm rounded-none">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="investment" className="text-base font-semibold">
                Kwota inwestycji (PLN)
              </Label>
              <Input
                id="investment"
                type="number"
                value={investment}
                onChange={(e) => setInvestment(Number.parseFloat(e.target.value) || 0)}
                step="1000"
                min="100"
                className="rounded-none text-lg font-semibold"
              />
              <p className="text-sm text-gray-600">Minimalna kwota: 100 PLN</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Okres inwestycji</Label>
                <Badge variant="secondary" className="text-base font-semibold px-4 py-1 rounded-none">
                  {monthsToWithdraw}{" "}
                  {monthsToWithdraw === 1 ? "miesiąc" : monthsToWithdraw < 5 ? "miesiące" : "miesięcy"}
                </Badge>
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

            <div className="flex items-center justify-between p-4 rounded-none border bg-gray-50">
              <div>
                <Label htmlFor="reinvest" className="text-base font-medium cursor-pointer">
                  Automatyczne reinwestowanie
                </Label>
                <p className="text-sm text-gray-600">Kupuj kolejne emisje po wykupie</p>
              </div>
              <Switch id="reinvest" checked={autoReinvest} onCheckedChange={setAutoReinvest} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-none border bg-gray-50">
              <div>
                <Label htmlFor="excludeFamily" className="text-base font-medium cursor-pointer">
                  Wyklucz obligacje rodzinne (ROD, ROS)
                </Label>
                <p className="text-sm text-gray-600">Obligacje ROD i ROS są dostępne tylko dla rodzin z dziećmi</p>
              </div>
              <Switch id="excludeFamily" checked={excludeFamilyBonds} onCheckedChange={setExcludeFamilyBonds} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inflation" className="text-sm font-medium">
                  Inflacja roczna (%)
                </Label>
                <Input
                  id="inflation"
                  type="number"
                  value={inflation}
                  onChange={(e) => setInflation(Number.parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nbpRate" className="text-sm font-medium">
                  Stopa referencyjna NBP (%)
                </Label>
                <Input
                  id="nbpRate"
                  type="number"
                  value={nbpRate}
                  onChange={(e) => setNbpRate(Number.parseFloat(e.target.value) || 0)}
                  step="0.25"
                  className="rounded-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white border rounded-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full">
              <div className="flex-shrink-0 w-64 border-r bg-gray-50">
                <div className="h-80 border-b flex items-center justify-center">
                  <div className="text-center px-4">
                    <p className="text-sm text-gray-500 mb-2">Porównaj obligacje</p>
                  </div>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Cena zakupu</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Odsetki</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Okres oprocentowania</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Cena zamiany</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Wcześniejszy wykup</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Opłata za wykup</p>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Warunki wykupu</p>
                </div>
                <div className="border-b p-4 h-32 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Zalety</p>
                </div>
                <div className="p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Zysk po {monthsToWithdraw} mies.</p>
                </div>
              </div>

              {results.map((bond, idx) => (
                <div key={bond.name} className={`flex-shrink-0 w-64 ${idx < results.length - 1 ? "border-r" : ""}`}>
                  <div className="h-80 border-b p-6 flex flex-col justify-between bg-white">
                    <div className="space-y-3">
                      <div className="bg-green-50 border-2 border-green-500 p-3 rounded-none">
                        <p className="text-xs text-green-700 font-semibold mb-1">ZYSK PO {monthsToWithdraw} MIES.</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(bond.profit)}</p>
                      </div>
                      <div
                        className={`text-5xl font-bold ${
                          bond.typeLabel === "STAŁOPROCENTOWE"
                            ? "text-red-600"
                            : bond.typeLabel === "ZMIENNOPROCENTOWE"
                              ? "text-blue-600"
                              : "text-purple-600"
                        }`}
                      >
                        {bond.interestRate.toFixed(2)}%
                      </div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{bond.displayName}</h3>
                      <Badge
                        variant="outline"
                        className={`font-semibold text-xs rounded-none ${
                          bond.typeLabel === "STAŁOPROCENTOWE"
                            ? "text-red-600 border-red-600 bg-red-50"
                            : bond.typeLabel === "ZMIENNOPROCENTOWE"
                              ? "text-blue-600 border-blue-600 bg-blue-50"
                              : "text-purple-600 border-purple-600 bg-purple-50"
                        }`}
                      >
                        {bond.typeLabel}
                      </Badge>
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">Seria:</span> {bond.series}
                      </p>
                    </div>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center">{bond.purchasePrice.toFixed(2)} zł</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-xs text-center leading-relaxed">{bond.interestDetails}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-xs text-center">{bond.interestPeriod}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center">
                      {typeof bond.exchangePrice === "number"
                        ? `${bond.exchangePrice.toFixed(2)} zł`
                        : bond.exchangePrice}
                    </p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center">{bond.earlyWithdrawalPossible ? "Tak" : "Nie"}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm text-center">{bond.withdrawalFee}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-xs text-center">{bond.withdrawalConditions}</p>
                  </div>

                  <div className="border-b p-4 h-32 flex items-center">
                    <p className="text-xs text-gray-700 text-center leading-relaxed">{bond.advantages}</p>
                  </div>

                  <div className="px-4 pb-4 pt-4 space-y-2">
                    <a
                      href={bond.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center bg-[#0033CC] hover:bg-[#0029AA] text-white font-semibold rounded-none h-10"
                    >
                      Kup
                    </a>
                    <a
                      href={bond.detailsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-sm text-[#0033CC] hover:underline font-medium"
                    >
                      Szczegóły →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border shadow-sm bg-blue-50 rounded-none">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-900">Informacje dodatkowe</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Wszystkie obliczenia uwzględniają podatek Belki (19%)</p>
              <p>• Inwestycja bazowa: {formatCurrency(investment)}</p>
              <p>
                • Obligacje zmiennoprocentowe (ROR, DOR) dostosowują się do stopy referencyjnej NBP (obecnie{" "}
                {nbpRate.toFixed(2)}%)
              </p>
              <p>
                • Obligacje indeksowane inflacją (COI, ROS, EDO, ROD) chronią przed inflacją (założona: {inflation}%)
              </p>
              {autoReinvest && (
                <p className="font-medium">
                  • Z włączonym reinwestowaniem, po wykupie obligacji całość kapitału jest automatycznie inwestowana w
                  kolejną emisję
                </p>
              )}
              {excludeFamilyBonds && (
                <p className="font-medium">• Obligacje rodzinne (ROD, ROS) zostały wyłączone z obliczeń</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BondsCalculator
