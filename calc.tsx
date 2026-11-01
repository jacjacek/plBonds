"use client"

import { useState, useMemo, useEffect } from "react"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { BONDS, OFFER, isOfferCurrent } from "@/lib/bonds"
import { addMonths, calculateReturn, MAX_INVESTMENT } from "@/lib/calculator"

const BondsCalculator = () => {
  const [monthsToWithdraw, setMonthsToWithdraw] = useState(12)
  const [inflation, setInflation] = useState(2.5)
  const [nbpRate, setNbpRate] = useState(4)
  const [autoReinvest, setAutoReinvest] = useState(false)
  const [excludeFamilyBonds, setExcludeFamilyBonds] = useState(true)
  const [investment, setInvestment] = useState(100000)

  const [purchaseDate, setPurchaseDate] = useState(OFFER.validFrom)
  const [offerCurrent, setOfferCurrent] = useState(true)
  useEffect(() => {
    const check = () => setOfferCurrent(isOfferCurrent(new Date()))
    check()
    const timer = window.setInterval(check, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  // Helpers for robust numeric inputs (support comma/dot, preserve mid-typing)
  const normalizeDecimal = (value: string): string => value.replace(/\s+/g, "").replace(",", ".")
  const isPartialNumeric = (value: string): boolean => /^-?[0-9]*([,.][0-9]*)?$/.test(value)

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

  const results = useMemo(() => {
    const filteredBonds = excludeFamilyBonds
      ? BONDS.filter((bond) => !bond.familyOnly)
      : BONDS

    return filteredBonds
      .map((bond) => ({
        ...bond,
        interestPeriod: [new Date(`${purchaseDate}T00:00:00Z`), addMonths(new Date(`${purchaseDate}T00:00:00Z`), bond.variableRate ? (bond.basedOnNBP ? 1 : 12) : bond.maturityMonths)]
          .map((date) => new Intl.DateTimeFormat("pl-PL", { timeZone: "UTC" }).format(date)).join(" – "),
        ...calculateReturn(bond, { investment, months: monthsToWithdraw, inflation, nbpRate, autoReinvest, purchaseDate }),
      }))
      .sort((a, b) => b.profit - a.profit)
  }, [investment, monthsToWithdraw, inflation, nbpRate, autoReinvest, excludeFamilyBonds, purchaseDate])

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
            skarbowych. Porównaj ofertę obligacji Skarbu Państwa ({OFFER.label}) i sprawdź wynik dla swoich założeń.
          </p>
        </div>

        <div className={`border p-4 text-sm ${offerCurrent ? "bg-blue-50 text-blue-950" : "bg-amber-50 border-amber-400 text-amber-950"}`} role="status">
          <p className="font-semibold">Oferta: {OFFER.label} · sprzedaż {OFFER.validFrom} – {OFFER.validTo} · weryfikacja {OFFER.verifiedAt}</p>
          {!offerCurrent && <p className="mt-1 font-semibold">Ta oferta jest archiwalna. Sprawdź aktualne warunki przed zakupem.</p>}
          <a href={OFFER.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Źródło: obligacjeskarbowe.pl</a>
        </div>

        <Card className="border shadow-sm rounded-none">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="investment" className="text-base font-semibold">
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
                    const clamped = Math.round(Math.min(MAX_INVESTMENT, Math.max(100, parsed)) * 100) / 100
                    setInvestment(clamped)
                    setInvestmentRaw(String(clamped).replace(".", ","))
                  } else {
                    setInvestmentRaw(String(investment).replace(".", ","))
                  }
                }}
                className="rounded-none text-lg font-semibold"
              />
              <p className="text-sm text-gray-600">Od 100 zł do 1 mld zł. Kupujemy pełne obligacje po 100 zł, a reszta pozostaje w gotówce.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data zakupu z tej oferty</Label>
              <Input id="purchaseDate" type="date" min={OFFER.validFrom} max={OFFER.validTo}
                value={purchaseDate}
                onChange={(event) => {
                  const value = event.target.value
                  if (value >= OFFER.validFrom && value <= OFFER.validTo) setPurchaseDate(value)
                }} className="rounded-none w-full sm:w-64" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="horizon" className="text-base font-semibold">Okres inwestycji</Label>
                <Badge variant="secondary" className="text-base font-semibold px-4 py-1 rounded-none">
                  {monthsToWithdraw}{" "}
                  {monthsToWithdraw === 1 ? "miesiąc" : monthsToWithdraw < 5 ? "miesiące" : "miesięcy"}
                </Badge>
              </div>
              <Slider
                id="horizon"
                aria-label="Okres inwestycji w miesiącach"
                value={[monthsToWithdraw]}
                onValueChange={(value) => setMonthsToWithdraw(value[0])}
                min={1}
                max={144}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-none border bg-gray-50">
              <div>
                <Label htmlFor="reinvest" className="text-base font-medium cursor-pointer">
                  Reinwestowanie po wykupie
                </Label>
                <p className="text-sm text-gray-600">Po terminowym wykupie kupuj pełne obligacje po 100 zł. Kupony czekają w gotówce do wykupu.</p>
              </div>
              <Switch id="reinvest" checked={autoReinvest} onCheckedChange={setAutoReinvest} />
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-none border bg-gray-50">
              <div>
                <Label htmlFor="excludeFamily" className="text-base font-medium cursor-pointer">
                  Wyklucz obligacje rodzinne (ROD, ROS)
                </Label>
                <p className="text-sm text-gray-600">ROS i ROD: tylko dla uprawnionych do 800+, w granicach dostępnego limitu.</p>
              </div>
              <Switch id="excludeFamily" checked={excludeFamilyBonds} onCheckedChange={setExcludeFamilyBonds} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inflation" className="text-sm font-medium">
                  Założona przyszła inflacja roczna (%)
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
                      const value = Math.min(100, Math.max(-20, parsed))
                      setInflation(value)
                      setInflationRaw(String(value).replace(".", ","))
                    } else {
                      setInflationRaw(String(inflation).replace(".", ","))
                    }
                  }}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nbpRate" className="text-sm font-medium">
                  Założona przyszła stopa NBP (%)
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
                      const value = Math.min(100, Math.max(0, parsed))
                      setNbpRate(value)
                      setNbpRateRaw(String(value).replace(".", ","))
                    } else {
                      setNbpRateRaw(String(nbpRate).replace(".", ","))
                    }
                  }}
                  className="rounded-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-600 md:hidden">Przesuń tabelę w bok, aby porównać kolejne obligacje. Wyniki są posortowane od największego zysku.</p>
        <div className="bg-white border rounded-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto snap-x snap-mandatory md:snap-none" aria-label="Porównanie obligacji">
            <div className="inline-flex min-w-full">
              <div className="hidden md:block flex-shrink-0 w-64 border-r bg-gray-50">
                <div className="h-96 border-b flex items-center justify-center">
                  <div className="text-center px-4">
                    <p className="text-sm text-gray-500 mb-2">Porównaj obligacje</p>
                  </div>
                </div>
                <div className="border-b p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Cena zakupu</p>
                </div>
                <div className="border-b p-4 h-28 flex items-center">
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
                <div className="border-b p-4 h-28 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Warunki wykupu</p>
                </div>
                <div className="border-b p-4 h-32 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Zalety</p>
                </div>
                <div className="p-4 h-20 flex items-center">
                  <p className="text-sm font-semibold text-[#0033CC]">Rozliczenie i zakup</p>
                </div>
              </div>

              {results.map((bond, idx) => (
                <div key={bond.name} data-testid={`bond-${bond.name}`} className={`snap-start flex-shrink-0 w-[calc(100vw-2rem-2px)] sm:w-64 ${idx < results.length - 1 ? "border-r" : ""}`}>
                  <div className="h-96 border-b p-6 flex flex-col justify-between bg-white">
                    <div className="space-y-3">
                      <div className="bg-green-50 border-2 border-green-500 p-3 rounded-none">
                        <p className="text-xs text-green-700 font-semibold mb-1">ZYSK PO {monthsToWithdraw} MIES.</p>
                        <p data-testid="profit" className={`text-2xl break-words font-bold ${bond.profit < 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(bond.profit)}</p>
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
                        {bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}%
                      </div>
                      <p className="text-xs text-gray-500">W skali roku{bond.variableRate ? (bond.basedOnNBP ? "; pierwszy miesiąc" : "; pierwszy rok") : ""}</p>
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
                    <p className="text-sm font-semibold text-center"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Cena zakupu</span>{formatCurrency(bond.purchasePrice)}</p>
                  </div>

                  <div className="border-b p-4 h-28 flex items-center justify-center">
                    <p className="text-xs text-center leading-relaxed"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Odsetki</span>{bond.interestDetails}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-xs text-center"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Okres oprocentowania</span>{bond.interestPeriod}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center">
                      <span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Cena zamiany</span>
                      {typeof bond.exchangePrice === "number"
                        ? formatCurrency(bond.exchangePrice)
                        : "Brak"}
                    </p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Wcześniejszy wykup</span>{bond.earlyWithdrawalPossible ? "Tak" : "Nie"}</p>
                  </div>

                  <div className="border-b p-4 h-20 flex items-center justify-center">
                    <p className="text-sm text-center"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Opłata za wykup</span>{bond.withdrawalFee}</p>
                  </div>

                  <div className="border-b p-4 h-28 flex items-center justify-center">
                    <p className="text-xs text-center"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Warunki wykupu</span>{bond.withdrawalConditions}</p>
                  </div>

                  <div className="border-b p-4 h-32 flex items-center">
                    <p className="text-xs text-gray-700 text-center leading-relaxed"><span className="block md:hidden text-xs font-semibold text-[#0033CC] mb-1">Zalety</span>{bond.advantages}</p>
                  </div>

                  <div className="px-4 pb-4 pt-4 space-y-2">
                    <details className="text-xs text-gray-700 mb-4">
                      <summary className="cursor-pointer font-semibold text-[#0033CC]">Rozliczenie wyniku</summary>
                      <dl className="mt-3 space-y-2" data-testid="breakdown">
                        <div><dt>Łączne środki netto</dt><dd>{formatCurrency(bond.totalValue)}</dd></div>
                        <div><dt>Odsetki brutto łącznie</dt><dd>{formatCurrency(bond.grossInterest)}</dd></div>
                        <div><dt>Podatek łącznie</dt><dd>{formatCurrency(bond.tax)}</dd></div>
                        <div><dt>Opłaty łącznie</dt><dd>{formatCurrency(bond.fees)}</dd></div>
                        <div><dt>Obligacje przy pierwszym zakupie</dt><dd>{bond.initialBondCount} szt.</dd></div>
                        <div><dt>Gotówka po pierwszym zakupie</dt><dd>{formatCurrency(bond.initialCash)}</dd></div>
                        <div><dt>Liczba zakupów</dt><dd>{bond.purchaseRounds.length}</dd></div>
                      </dl>
                      {bond.familyReinvestmentSkipped && <p className="mt-2">Po wykupie środki pozostają w gotówce: ponowny zakup ROS/ROD wymaga nowego limitu 800+.</p>}
                    </details>
                    <a
                      href={bond.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center bg-[#0033CC] hover:bg-[#0029AA] text-white font-semibold rounded-none h-10"
                    >
                      Kup
                    </a>
                    <a href={bond.emissionLetterUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-[#0033CC] hover:underline">List emisyjny (PDF)</a>
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
            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
              <li>Wynik to kapitał, niewydana gotówka i wszystkie wypłacone odsetki, po podatku 19% i opłatach.</li>
              <li>Stawka pierwszego miesiąca ROR/DOR i pierwszego roku obligacji inflacyjnych pochodzi z oferty. Późniejsze stawki wyliczamy z Twoich stałych założeń; nie jest to prognoza NBP ani GUS.</li>
              <li>Ujemna inflacja nie obniża oprocentowania poniżej marży. Podatek może sprawić, że zysk netto nie pokryje inflacji.</li>
              <li>Bez reinwestowania środki po wykupie i wypłacone kupony pozostają nieoprocentowane. Reinwestowanie obejmuje kapitał, zebrane kupony i resztę gotówki, dopiero w terminie wykupu.</li>
              <li>Przyszłe emisje symulujemy na warunkach obecnej oferty, po cenie 100 zł, bez dyskonta za zamianę. ROS/ROD nie są kupowane ponownie automatycznie: wymagają dostępnego limitu 800+.</li>
              <li>Odsetki za niepełny rok liczymy proporcjonalnie do rzeczywistej liczby dni. Kupon kończący się w dniu wcześniejszego wykupu rozliczamy z tym wykupem. Odsetki jednej obligacji zaokrąglamy do grosza, podatek w górę od całej wypłaty danej partii.</li>
              <li>To symulacja porównawcza na zwykłym rachunku, bez IKE/IKZE. Horyzont wskazuje dzień rozliczenia; nie doliczamy 5 dni roboczych od dyspozycji ani przesunięć wypłat w święta. Rzeczywiste rozliczenie banku może różnić się terminem i zaokrągleniami.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BondsCalculator
