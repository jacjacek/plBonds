"use client"

import { useState, useMemo, useEffect } from "react"
import type React from "react"
import { ArrowUpRight, ChevronDown, ArrowRight, SlidersHorizontal, Check } from "lucide-react"
import { Slider } from "@/components/ui/slider"
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
  const isPartialNumeric = (value: string): boolean => /^-?[0-9]*([,.][0-9]*)?$/.test(value.replace(/\s/g, ""))

  const handleEnterBlur = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // Raw input strings to avoid jumping to 0 during typing
  const [investmentRaw, setInvestmentRaw] = useState<string>(investment.toLocaleString("pl-PL", { maximumFractionDigits: 2 }))
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

  const term = (months: number) => ({ 3: "3 miesiące", 12: "1 rok", 24: "2 lata", 36: "3 lata", 48: "4 lata", 72: "6 lat", 120: "10 lat", 144: "12 lat" } as Record<number, string>)[months] ?? `${months} mies.`
  const formatDate = (date: string) => new Intl.DateTimeFormat("pl-PL", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00Z`))
  const bestProfit = Math.max(0, ...results.map((bond) => bond.profit))
  const money = (value: number) => formatCurrency(value).replace(/\s*zł$/, "")
  const leader = results[0]
  const years = monthsToWithdraw / 12
  const horizonLabel = monthsToWithdraw % 12 === 0
    ? `${years} ${years === 1 ? "rok" : years < 5 ? "lata" : "lat"}`
    : `${monthsToWithdraw} mies.`

  return (
    <div className="bonds-app">
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="wordmark" href="#" aria-label="plBonds — kalkulator obligacji">
            <span className="brand-mark" aria-hidden="true">pl<span /></span>
            <span className="brand-name">plBonds<span>Obligacje skarbowe</span></span>
          </a>
          <nav className="header-nav" aria-label="Nawigacja główna">
            <a href="#kalkulator" className="is-active">Kalkulator</a>
            <a href="#zasady">Jak liczymy</a>
          </nav>
          <a className="source-link" href={OFFER.sourceUrl} target="_blank" rel="noopener noreferrer">
            Oficjalna oferta <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="page-width" id="kalkulator">
        <section className="page-intro" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Kalkulator obligacji<br /><span>skarbowych.</span></h1>
            <p className="intro-copy">Porównaj zysk z aktualnej oferty. Z uwzględnieniem podatku i opłat za wcześniejszy wykup.</p>
          </div>
          <div className={`offer-meta ${!offerCurrent ? "offer-archived" : ""}`} role="status">
            <span className="offer-label"><span aria-hidden="true" /> Oferta · {OFFER.label}</span>
            <span>Sprzedaż {formatDate(OFFER.validFrom)} – {formatDate(OFFER.validTo)}</span>
            {!offerCurrent && <strong>Ta oferta jest archiwalna. Sprawdź aktualne warunki przed zakupem.</strong>}
          </div>
        </section>

        <div className="calculator-workspace">
          <section className="scenario-panel" aria-labelledby="scenario-title">
            <div className="panel-heading"><h2 id="scenario-title">Twoja inwestycja</h2></div>
            <div className={`field investment-field ${investmentRaw.replace(/\s/g, "").length > 8 ? "is-large" : ""}`}>
              <label htmlFor="investment">Kwota inwestycji</label>
              <div className="input-wrap">
                <input id="investment" aria-label="Kwota inwestycji (PLN)" type="text" inputMode="decimal" value={investmentRaw}
                  onChange={(e) => { if (e.target.value === "" || isPartialNumeric(e.target.value)) setInvestmentRaw(e.target.value) }}
                  onKeyDown={handleEnterBlur}
                  onBlur={() => {
                    const parsed = Number.parseFloat(normalizeDecimal(investmentRaw))
                    if (Number.isFinite(parsed)) {
                      const value = Math.round(Math.min(MAX_INVESTMENT, Math.max(100, parsed)) * 100) / 100
                      setInvestment(value)
                      setInvestmentRaw(value.toLocaleString("pl-PL", { maximumFractionDigits: 2 }))
                    } else setInvestmentRaw(String(investment).replace(".", ","))
                  }} />
                <span className="input-unit">zł</span>
              </div>
              <p className="field-hint">Jedna obligacja kosztuje 100 zł.</p>
            </div>

            <div className="field horizon-field">
              <div className="field-line"><label htmlFor="horizon">Okres inwestycji</label><span className="horizon-value">{horizonLabel}</span></div>
              <Slider id="horizon" aria-label="Okres inwestycji w miesiącach" aria-valuetext={horizonLabel} className="horizon-slider"
                value={[monthsToWithdraw]} onValueChange={(value) => setMonthsToWithdraw(value[0])} min={1} max={144} step={1} />
              <div className="horizon-presets" aria-label="Szybki wybór okresu">
                {[{ months: 12, label: "1 rok" }, { months: 36, label: "3 lata" }, { months: 120, label: "10 lat" }].map((preset) => (
                  <button key={preset.months} type="button" onClick={() => setMonthsToWithdraw(preset.months)} aria-pressed={monthsToWithdraw === preset.months}>{preset.label}</button>
                ))}
              </div>
            </div>

            <details className="advanced-settings">
              <summary><SlidersHorizontal size={18} aria-hidden="true" /><span>Dostosuj założenia<small>Inflacja {inflation.toLocaleString("pl-PL")}%, stopa NBP {nbpRate.toLocaleString("pl-PL")}%</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
              <div className="advanced-body">
                <div className="field-pair">
                  <div className="field">
                    <label htmlFor="inflation">Inflacja roczna</label>
                    <div className="input-wrap">
                      <input id="inflation" aria-label="Założona przyszła inflacja roczna (%)" type="text" inputMode="decimal" value={inflationRaw}
                        onChange={(e) => { if (e.target.value === "" || isPartialNumeric(e.target.value)) setInflationRaw(e.target.value) }}
                        onKeyDown={handleEnterBlur} onBlur={() => {
                          const parsed = Number.parseFloat(normalizeDecimal(inflationRaw))
                          if (Number.isFinite(parsed)) {
                            const value = Math.min(100, Math.max(-20, parsed))
                            setInflation(value); setInflationRaw(String(value).replace(".", ","))
                          } else setInflationRaw(String(inflation).replace(".", ","))
                        }} />
                      <span className="input-unit">%</span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="nbpRate">Stopa NBP</label>
                    <div className="input-wrap">
                      <input id="nbpRate" aria-label="Założona przyszła stopa NBP (%)" type="text" inputMode="decimal" value={nbpRateRaw}
                        onChange={(e) => { if (e.target.value === "" || isPartialNumeric(e.target.value)) setNbpRateRaw(e.target.value) }}
                        onKeyDown={handleEnterBlur} onBlur={() => {
                          const parsed = Number.parseFloat(normalizeDecimal(nbpRateRaw))
                          if (Number.isFinite(parsed)) {
                            const value = Math.min(100, Math.max(0, parsed))
                            setNbpRate(value); setNbpRateRaw(String(value).replace(".", ","))
                          } else setNbpRateRaw(String(nbpRate).replace(".", ","))
                        }} />
                      <span className="input-unit">%</span>
                    </div>
                  </div>
                  <p className="field-hint">Twoje założenia dla kolejnych okresów odsetkowych.</p>
                </div>

                <div className="field date-field">
                  <label htmlFor="purchaseDate">Data zakupu</label>
                  <input id="purchaseDate" type="date" min={OFFER.validFrom} max={OFFER.validTo} value={purchaseDate}
                    onChange={(event) => {
                      const value = event.target.value
                      if (value >= OFFER.validFrom && value <= OFFER.validTo) setPurchaseDate(value)
                    }} />
                </div>

                <div className="scenario-options">
                  <div className="option-row">
                    <label htmlFor="reinvest"><span>Reinwestowanie po wykupie</span><small>Kolejny zakup po terminowym wykupie.</small></label>
                    <input className="scenario-toggle" type="checkbox" role="switch" id="reinvest" checked={autoReinvest} onChange={(e) => setAutoReinvest(e.target.checked)} />
                  </div>
                  <div className="option-row">
                    <label htmlFor="includeFamily"><span>Uwzględnij obligacje rodzinne</span><small>ROS i ROD · wymagany limit 800+.</small></label>
                    <input className="scenario-toggle" type="checkbox" role="switch" id="includeFamily" checked={!excludeFamilyBonds} onChange={(e) => setExcludeFamilyBonds(!e.target.checked)} />
                  </div>
                </div>
              </div>
            </details>
            <div className="scenario-inclusions"><span><Check size={15} aria-hidden="true" /> Podatek 19%</span><span><Check size={15} aria-hidden="true" /> Opłaty za wykup</span></div>
            <p className="scenario-footnote">Wyniki przeliczamy automatycznie. Założenia przyszłych stóp i inflacji możesz zmienić powyżej.</p>
          </section>

          <section className="outcome-panel" aria-labelledby="outcome-title">
            <div className="outcome-heading"><h2 id="outcome-title">Najwyższy wynik w tym scenariuszu</h2><span className="outcome-bond">{leader.name} <span>· {term(leader.maturityMonths)}</span></span></div>
            <p className={`outcome-profit ${money(leader.profit).length > 17 ? "outcome-profit-long" : money(leader.profit).length > 11 ? "outcome-profit-medium" : ""}`}>{money(leader.profit)}<span> zł</span></p>
            <p className="outcome-caption">zysku netto po {monthsToWithdraw} mies.</p>
            <div className="outcome-total"><span>Łącznie z kapitałem</span><strong>{formatCurrency(leader.totalValue)}</strong></div>
            <div className="profit-chart">
              <div className="chart-heading"><span>Porównanie zysku netto</span><a href="#porownanie">Szczegóły <ArrowRight size={15} aria-hidden="true" /></a></div>
              <div className="chart-rows">
                {results.map((bond, idx) => (
                  <div className={`chart-row ${idx === 0 ? "chart-leader" : ""}`} key={bond.name}>
                    <div className="chart-row-heading"><span>{bond.name}<small>{term(bond.maturityMonths)}</small></span><span>{formatCurrency(bond.profit)}</span></div>
                    <div className="chart-track" aria-hidden="true"><span style={{ width: `${bestProfit > 0 ? Math.max(0, bond.profit) / bestProfit * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="results-section" id="porownanie" aria-labelledby="results-title">
          <div className="results-heading">
            <div><p className="eyebrow">Szczegóły oferty</p><h2 id="results-title">Porównaj obligacje</h2></div>
            <p className="results-context"><span>{formatCurrency(investment)} · {horizonLabel}</span><span>Od najwyższego zysku netto</span></p>
          </div>
          <div className="comparison-surface">
            <div className="comparison-head" aria-hidden="true"><span>Obligacja</span><span>Oprocentowanie¹</span><span>Zysk netto</span><span>Łączne środki</span><span /></div>
            <div className="bond-list" aria-label="Porównanie obligacji">
              {results.map((bond, idx) => (
                <details key={bond.name} data-testid={`bond-${bond.name}`} className={`bond-row ${idx === 0 && bond.profit > 0 ? "leading-result" : ""}`}>
                  <summary className="bond-summary">
                    <span className="bond-identity"><span className={`bond-symbol bond-color-${bond.name.toLowerCase()}`}>{bond.name}</span><span><span className="bond-term">{term(bond.maturityMonths)}</span><span className="bond-kind"><span className="kind-desktop">{bond.basedOnInflation ? "Indeksowane inflacją" : bond.basedOnNBP ? "Zmienne · stopa NBP" : "Stałe oprocentowanie"}</span><span className="kind-mobile">{bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}% rocznie¹</span></span></span></span>
                    <span className="bond-rate"><span>{bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}<small>%</small></span><span className="rate-period">{bond.variableRate ? (bond.basedOnNBP ? "pierwszy miesiąc" : "pierwszy rok") : "w skali roku"}</span></span>
                    <span className={`bond-profit ${bond.profit < 0 ? "negative-value" : ""} ${money(bond.profit).length > 12 ? "long-amount" : ""}`}><span className="mobile-profit-label">Zysk netto</span><span data-testid="profit">{money(bond.profit)}<small> zł</small></span>{idx === 0 && bond.profit > 0 && <span className="result-tag">Najwyższy wynik</span>}</span>
                    <span className="bond-total">{money(bond.totalValue)}<small> zł</small></span>
                    <ChevronDown className="row-chevron" size={17} aria-hidden="true" />
                  </summary>
                  <div className="bond-details">
                    <div className="detail-intro"><span>{bond.series}</span><p>{bond.displayName}</p></div>
                    <div className="detail-columns">
                      <dl className="bond-facts">
                        <div><dt>Oprocentowanie</dt><dd>{bond.interestDetails}</dd></div>
                        <div><dt>Okres oprocentowania</dt><dd>{bond.interestPeriod}</dd></div>
                        <div><dt>Wypłata odsetek</dt><dd>{bond.interestPayment === "monthly" ? "Co miesiąc" : bond.interestPayment === "yearly" ? "Co rok" : "Przy wykupie"}</dd></div>
                        <div><dt>Wcześniejszy wykup</dt><dd>{bond.loseInterestOnEarlyWithdrawal ? "Bez opłaty · utrata odsetek" : `${bond.withdrawalFee} za obligację`}</dd></div>
                        <div><dt>Cena zakupu / zamiany</dt><dd>{formatCurrency(bond.purchasePrice)} / {typeof bond.exchangePrice === "number" ? formatCurrency(bond.exchangePrice) : "brak zamiany"}</dd></div>
                      </dl>
                      <div className="calculation-ledger" data-testid="breakdown">
                        <h3>Rozliczenie scenariusza</h3>
                        <dl>
                          <div><dt>Odsetki brutto</dt><dd>{formatCurrency(bond.grossInterest)}</dd></div>
                          <div><dt>Podatek 19%</dt><dd>{formatCurrency(bond.tax)}</dd></div>
                          <div><dt>Opłaty za wykup</dt><dd>{formatCurrency(bond.fees)}</dd></div>
                          <div><dt>Pierwszy zakup</dt><dd>{bond.initialBondCount.toLocaleString("pl-PL")} szt.</dd></div>
                          <div><dt>Reszta po 1. zakupie</dt><dd>{formatCurrency(bond.initialCash)}</dd></div>
                          <div><dt>Liczba zakupów</dt><dd>{bond.purchaseRounds.length}</dd></div>
                          <div className="ledger-total"><dt>Łączne środki netto</dt><dd>{formatCurrency(bond.totalValue)}</dd></div>
                        </dl>
                      </div>
                    </div>
                    <p className="withdrawal-note">{bond.withdrawalConditions}</p>
                    {bond.familyReinvestmentSkipped && <p className="withdrawal-note">Po wykupie środki pozostają w gotówce: ponowny zakup ROS/ROD wymaga nowego limitu 800+.</p>}
                    <div className="detail-links">
                      <div><a href={bond.detailsUrl} target="_blank" rel="noopener noreferrer">Warunki emisji <ArrowUpRight size={14} aria-hidden="true" /></a><a href={bond.emissionLetterUrl} target="_blank" rel="noopener noreferrer">List emisyjny <ArrowUpRight size={14} aria-hidden="true" /></a></div>
                      <a className="purchase-link" href={bond.buyUrl} target="_blank" rel="noopener noreferrer">Przejdź do zakupu <ArrowRight size={15} aria-hidden="true" /></a>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
          <div className="results-notes"><p>Posortowano według zysku netto. Rozwiń wiersz, aby zobaczyć rozliczenie.</p><p>¹ Stawka roczna. Dla obligacji zmiennych dotyczy pierwszego okresu odsetkowego.</p></div>
          <div className="results-disclaimer"><span aria-hidden="true">i</span><p>To symulacja dla Twoich założeń. Przyszłe stopy procentowe i inflacja mogą zmienić wynik.</p></div>
        </section>

        <details className="methodology" id="zasady">
          <summary><span><span className="eyebrow">Zasady kalkulatora</span><span className="methodology-title">Jak liczymy wynik?</span></span><ChevronDown size={20} aria-hidden="true" /></summary>
          <div className="methodology-body">
            <section><h3>Odsetki, podatek i opłaty</h3><p>Wynik obejmuje kapitał, niewydaną gotówkę i wypłacone kupony po podatku 19% oraz opłatach. Kupujemy pełne obligacje po 100 zł. Opłata za wcześniejszy wykup pomniejsza odsetki przed podatkiem, zgodnie z zasadami danej emisji.</p><p>ROR i DOR wypłacają odsetki miesięcznie, COI rocznie. TOS, EDO, ROS i ROD mają roczną kapitalizację i podatek przy wypłacie. Ujemna inflacja nie obniża oprocentowania poniżej marży; zysk netto może być niższy od inflacji.</p></section>
            <section><h3>Reinwestowanie</h3><p>Bez reinwestowania środki po wykupie i kupony pozostają nieoprocentowane. Po włączeniu tej opcji przy terminowym wykupie kupujemy pełne obligacje za kapitał, zebrane kupony i resztę gotówki.</p><p>Przyszłe emisje symulujemy na warunkach obecnej oferty, po cenie 100 zł, bez dyskonta zamiany. ROS i ROD wymagają uprawnienia do 800+ oraz dostępnego limitu; nie są automatycznie kupowane ponownie.</p></section>
            <section><h3>Założenia i daty</h3><p>Pierwszy okres korzysta ze stawki oferty. Kolejne z Twoich stałych założeń NBP lub inflacji. Niepełny rok liczymy według rzeczywistej liczby dni. Kupon kończący się w dniu wcześniejszego wykupu rozliczamy razem z wykupem.</p><p>Horyzont wskazuje dzień rozliczenia, bez doliczania pięciu dni roboczych od dyspozycji i przesunięć w święta. Odsetki zaokrąglamy do grosza za obligację, podatek w górę od wypłaty partii. Rozliczenie banku może różnić się terminem i zaokrągleniami. Kalkulator nie obejmuje IKE/IKZE.</p></section>
          </div>
        </details>
      </main>
      <footer className="page-width site-footer"><p>plBonds <span>·</span> Niezależny kalkulator obligacji skarbowych.</p><p>Dane z {formatDate(OFFER.verifiedAt)} <a href={OFFER.sourceUrl} target="_blank" rel="noopener noreferrer">obligacjeskarbowe.pl <ArrowUpRight size={13} aria-hidden="true" /></a></p></footer>
    </div>
  )
}

export default BondsCalculator
