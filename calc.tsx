"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type React from "react"
import Image from "next/image"
import { ArrowUpRight, ChevronDown, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
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
  const money = (value: number) => formatCurrency(value).replace(/\s*zł$/, "")
  const leader = results[0]
  const comparisonScroll = useRef<HTMLDivElement>(null)
  const offerOrder = ["OTS", "ROR", "DOR", "TOS", "COI", "EDO", "ROS", "ROD"]
  const comparisonResults = [...results].sort((a, b) => offerOrder.indexOf(a.name) - offerOrder.indexOf(b.name))
  const scrollComparison = (direction: number) => {
    comparisonScroll.current?.scrollBy({ left: direction * 224, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }
  const years = monthsToWithdraw / 12
  const horizonLabel = monthsToWithdraw % 12 === 0
    ? `${years} ${years === 1 ? "rok" : years < 5 ? "lata" : "lat"}`
    : `${monthsToWithdraw} mies.`

  return (
    <div className="bonds-app">
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="wordmark" href="#" aria-label="plBonds — kalkulator obligacji">
            <span className="brand-name">plBonds</span><span>Obligacje<br />skarbowe</span>
          </a>
          <nav className="header-nav" aria-label="Nawigacja główna">
            <a href="#kalkulator" className="is-active">Kalkulator</a>
            <a href="#porownanie">Oferta obligacji</a>
            <a href="https://www.obligacjeskarbowe.pl/tabela-odsetkowa/" target="_blank" rel="noopener noreferrer">Tabele odsetkowe</a>
            <a href="https://www.obligacjeskarbowe.pl/listy-emisyjne/" target="_blank" rel="noopener noreferrer">Listy emisyjne</a>
            <a href="#zasady">Jak liczymy?</a>
          </nav>
          <a className="source-link" href="https://www.obligacjeskarbowe.pl/oferta/" target="_blank" rel="noopener noreferrer">Oficjalna oferta <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </header>

      <main id="kalkulator">
        <section className="page-intro page-width" aria-labelledby="page-title">
          <div className="intro-text">
            <h1 id="page-title">Tabela<br />porównawcza</h1>
            <p className="intro-copy">Obligacje skarbowe — porównaj aktualną ofertę i oblicz zysk dla swojej kwoty oraz okresu oszczędzania. Wyniki uwzględniają podatek i opłaty za wcześniejszy wykup.</p>
          </div>
          <Image className="comparison-illustration" src="/comparison.svg" width={360} height={240} alt="" unoptimized priority />
        </section>

        <div className="page-width calculator-workspace">
          <section className="scenario-panel" aria-labelledby="scenario-title">
            <div className="panel-heading"><h2 id="scenario-title">Oblicz zysk z obligacji</h2><span>Wyniki przeliczają się automatycznie</span></div>
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
          </section>
          <section className="outcome-panel" aria-labelledby="outcome-title">
            <h2 id="outcome-title">Najwyższy zysk w tym scenariuszu</h2>
            <span className="outcome-bond">{leader.name} · {term(leader.maturityMonths)}</span>
            <p className="outcome-profit">{money(leader.profit)}<span> zł</span></p>
            <span className="outcome-caption">netto po {monthsToWithdraw} mies.</span>
          </section>
        </div>

        <section className="results-section page-width" id="porownanie" aria-labelledby="results-title">
          <div className="results-toolbar">
            <h2 className="sr-only" id="results-title">Porównanie obligacji skarbowych</h2>
            <div className={`offer-meta ${!offerCurrent ? "offer-archived" : ""}`} role="status">
              <span className="offer-label">Oferta: {OFFER.label}</span><span>Sprzedaż {formatDate(OFFER.validFrom)} – {formatDate(OFFER.validTo)}</span>
              {!offerCurrent && <strong>Ta oferta jest archiwalna. Sprawdź aktualne warunki przed zakupem.</strong>}
            </div>
            <div className="comparison-navigation"><span>Przesuń tabelę</span><button type="button" onClick={() => scrollComparison(-1)} aria-label="Poprzednie obligacje"><ChevronLeft size={23} aria-hidden="true" /></button><button type="button" onClick={() => scrollComparison(1)} aria-label="Następne obligacje"><ChevronRight size={23} aria-hidden="true" /></button></div>
          </div>
          <div className="comparison-surface">
            <div className="comparison-labels" aria-hidden="true"><div className="comparison-label-header" /><div className="comparison-label profit-cell">Zysk netto</div><div className="comparison-label">Łączne środki netto</div><div className="comparison-label">Cena zakupu</div><div className="comparison-label rate-cell">Oprocentowanie</div><div className="comparison-label">Wypłata odsetek</div><div className="comparison-label fee-cell">Opłata za wcześniejszy wykup</div><div className="comparison-label actions-cell" /></div>
            <div className="comparison-scroller" ref={comparisonScroll} tabIndex={0} role="region" aria-label="Tabela porównawcza obligacji — przewijana poziomo">
              <div className="bond-list">
                {comparisonResults.map((bond) => (
                  <article key={bond.name} data-testid={`bond-${bond.name}`} className={`bond-row ${bond.name === leader.name && bond.profit > 0 ? "leading-result" : ""} ${bond.basedOnInflation ? "bond-inflation" : bond.basedOnNBP ? "bond-variable" : "bond-fixed"} ${bond.familyOnly ? "bond-family" : ""} ${money(bond.profit).length > 12 ? "long-result" : ""}`} aria-labelledby={`title-${bond.name}`}>
                    <div className="bond-card-header">
                      <p className="bond-rate">{bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}<span>%</span></p>
                      <h3 id={`title-${bond.name}`}>{bond.displayName}</h3>
                      <span className="bond-kind">{bond.basedOnInflation ? "Indeksowane inflacją" : bond.basedOnNBP ? "Zmiennoprocentowe" : "Stałoprocentowe"}</span>
                      <p className="bond-series"><strong>Seria:</strong> {bond.series}</p>
                    </div>
                    <div className="comparison-value profit-cell"><span className="mobile-cell-label">Zysk netto</span><span className="bond-profit" data-testid="profit">{money(bond.profit)}<small> zł</small></span>{bond.name === leader.name && bond.profit > 0 && <span className="result-tag">Najwyższy wynik</span>}</div>
                    <div className="comparison-value"><span className="mobile-cell-label">Łączne środki netto</span><span>{formatCurrency(bond.totalValue)}</span></div>
                    <div className="comparison-value mobile-extra"><span className="mobile-cell-label">Cena zakupu</span><span>{formatCurrency(bond.purchasePrice)}</span></div>
                    <div className="comparison-value rate-cell"><span className="mobile-cell-label">Oprocentowanie</span><span>{bond.variableRate ? `${bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}% w pierwszym ${bond.basedOnNBP ? "miesiącu" : "roku"}` : `${bond.interestRate.toLocaleString("pl-PL", { minimumFractionDigits: 2 })}% w skali roku`}{bond.variableRate && <small>Potem: {bond.basedOnNBP ? "stopa NBP" : "inflacja"} + {bond.margin.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} p.p.</small>}</span></div>
                    <div className="comparison-value mobile-extra"><span className="mobile-cell-label">Wypłata odsetek</span><span>{bond.interestPayment === "monthly" ? "Co miesiąc" : bond.interestPayment === "yearly" ? "Co rok" : "Przy wykupie"}</span></div>
                    <div className="comparison-value fee-cell mobile-extra"><span className="mobile-cell-label">Opłata za wcześniejszy wykup</span><span>{bond.loseInterestOnEarlyWithdrawal ? "Brak, utrata odsetek" : `${bond.withdrawalFee} za obligację`}</span></div>
                    <div className="comparison-value actions-cell"><a className="purchase-link" href={bond.buyUrl} target="_blank" rel="noopener noreferrer">Kup <ArrowUpRight size={14} aria-hidden="true" /></a><a className="conditions-link" href={bond.detailsUrl} target="_blank" rel="noopener noreferrer">Szczegóły emisji</a></div>
                    <details className="bond-calculation"><summary>Rozliczenie <ChevronDown size={17} aria-hidden="true" /></summary>
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
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="results-notes"><p>Zysk netto dotyczy {formatCurrency(investment)} i okresu {horizonLabel}. Kolejność obligacji odpowiada oficjalnej ofercie.</p><p>To symulacja dla Twoich założeń. Przyszłe stopy procentowe i inflacja mogą zmienić wynik.</p></div>
        </section>

        <div className="page-width">
        <details className="methodology" id="zasady">
          <summary><span><span className="eyebrow">Zasady kalkulatora</span><span className="methodology-title">Jak liczymy wynik?</span></span><ChevronDown size={20} aria-hidden="true" /></summary>
          <div className="methodology-body">
            <section><h3>Odsetki, podatek i opłaty</h3><p>Wynik obejmuje kapitał, niewydaną gotówkę i wypłacone kupony po podatku 19% oraz opłatach. Kupujemy pełne obligacje po 100 zł. Opłata za wcześniejszy wykup pomniejsza odsetki przed podatkiem, zgodnie z zasadami danej emisji.</p><p>ROR i DOR wypłacają odsetki miesięcznie, COI rocznie. TOS, EDO, ROS i ROD mają roczną kapitalizację i podatek przy wypłacie. Ujemna inflacja nie obniża oprocentowania poniżej marży; zysk netto może być niższy od inflacji.</p></section>
            <section><h3>Reinwestowanie</h3><p>Bez reinwestowania środki po wykupie i kupony pozostają nieoprocentowane. Po włączeniu tej opcji przy terminowym wykupie kupujemy pełne obligacje za kapitał, zebrane kupony i resztę gotówki.</p><p>Przyszłe emisje symulujemy na warunkach obecnej oferty, po cenie 100 zł, bez dyskonta zamiany. ROS i ROD wymagają uprawnienia do 800+ oraz dostępnego limitu; nie są automatycznie kupowane ponownie.</p></section>
            <section><h3>Założenia i daty</h3><p>Pierwszy okres korzysta ze stawki oferty. Kolejne z Twoich stałych założeń NBP lub inflacji. Niepełny rok liczymy według rzeczywistej liczby dni. Kupon kończący się w dniu wcześniejszego wykupu rozliczamy razem z wykupem.</p><p>Horyzont wskazuje dzień rozliczenia, bez doliczania pięciu dni roboczych od dyspozycji i przesunięć w święta. Odsetki zaokrąglamy do grosza za obligację, podatek w górę od wypłaty partii. Rozliczenie banku może różnić się terminem i zaokrągleniami. Kalkulator nie obejmuje IKE/IKZE.</p></section>
          </div>
        </details>
        </div>
      </main>
      <footer className="site-footer"><div className="page-width footer-inner"><div><strong>plBonds</strong><p>Niezależny kalkulator obligacji skarbowych.</p></div><div><p>Dane z {formatDate(OFFER.verifiedAt)}</p><a href="https://www.obligacjeskarbowe.pl/oferta/" target="_blank" rel="noopener noreferrer">Oferta na obligacjeskarbowe.pl <ArrowUpRight size={14} aria-hidden="true" /></a></div></div></footer>
    </div>
  )
}

export default BondsCalculator
