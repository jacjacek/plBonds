import { readFile } from "node:fs/promises"

const { offer, bonds } = JSON.parse(await readFile(new URL("../data/bonds.json", import.meta.url), "utf8"))
const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit",
}).formatToParts(new Date())
const month = `${parts.find((p) => p.type === "year").value}-${parts.find((p) => p.type === "month").value}`
if (offer.month !== month) {
  throw new Error(`Oferta ${offer.month} jest nieaktualna (${month}). Zaktualizuj data/bonds.json na podstawie listów emisyjnych.`)
}

const response = await fetch(offer.sourceUrl, { signal: AbortSignal.timeout(30_000) })
if (!response.ok) throw new Error(`Źródło oferty zwróciło HTTP ${response.status}`)
const html = await response.text()
const cards = [...html.matchAll(/<a\b(?=[^>]*class="product-card__link")[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].filter((match) => /\/(?:OTS|ROR|DOR|TOS|COI|EDO|ROS|ROD)\d{4}\/$/i.test(match[1]))
if (cards.length !== bonds.length) throw new Error(`Zmieniona struktura oferty: znaleziono ${cards.length} kart, oczekiwano ${bonds.length}. Wymagana ręczna weryfikacja.`)
for (const bond of bonds) {
  const path = new URL(bond.detailsUrl).pathname
  const card = cards.find((match) => match[1] === path)
  if (!card) throw new Error(`Brak aktualnej serii ${bond.series} na stronie źródłowej.`)
  const text = card[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
  const rate = text.match(/(\d+,\d+)\s*%/)
  if (!rate || Number(rate[1].replace(",", ".")) !== bond.interestRate) {
    throw new Error(`Zmiana oprocentowania ${bond.series}: źródło ${rate?.[1] ?? "nieznane"}%, aplikacja ${bond.interestRate}%.`)
  }
}
console.log(`Oferta ${offer.month}: wszystkie ${bonds.length} serii i stawek początkowych zgodne z ${offer.sourceUrl}`)
console.log("Marże, opłaty i pozostałe warunki wymagają weryfikacji w listach emisyjnych przy każdej aktualizacji.")
