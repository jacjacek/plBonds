import assert from "node:assert/strict"
import { test } from "node:test"
import { BONDS, OFFER, isOfferCurrent } from "../lib/bonds"
import { addMonths, calculateReturn, type CalculationInput } from "../lib/calculator"

const defaults: CalculationInput = {
  investment: 100, months: 12, inflation: 2.5, nbpRate: 4,
  autoReinvest: false, purchaseDate: "2026-11-01",
}
const bond = (name: string) => BONDS.find((item) => item.name === name)!
const calc = (name: string, changes: Partial<CalculationInput> = {}) => calculateReturn(bond(name), { ...defaults, ...changes })

test("OTS: official 0.50 zł coupon, 19% tax, no interest on early redemption", () => {
  assert.equal(calc("OTS", { months: 3 }).totalValue, 100.4)
  assert.equal(calc("OTS", { investment: 100_000, months: 3 }).profit, 405)
  assert.equal(calc("OTS", { months: 2 }).totalValue, 100)
})

test("purchases use whole bonds and preserve all unused cash", () => {
  const result = calc("OTS", { investment: 199.99, months: 3 })
  assert.equal(result.initialBondCount, 1)
  assert.equal(result.initialCash, 99.99)
  assert.equal(result.totalValue, 200.39)
  assert.equal(calc("OTS", { investment: 199.99, months: 6, autoReinvest: true }).totalValue, 201.2)
})

test("ROR: first month uses the offer, later months use assumed NBP", () => {
  const result = calc("ROR", { nbpRate: 6 })
  // 0.33 + 11*0.50 gross; taxes 0.07 + 11*0.10.
  assert.equal(result.grossInterest, 5.83)
  assert.equal(result.tax, 1.17)
  assert.equal(result.totalValue, 104.66)
  assert.equal(calc("ROR").totalValue, 103.12)
})

test("DOR: first month and 0.15 percentage-point margin, monthly tax", () => {
  const result = calc("DOR", { months: 24, nbpRate: 5 })
  assert.equal(result.grossInterest, 10.24)
  assert.equal(result.tax, 2.14)
  assert.equal(result.totalValue, 108.1)
})

test("ROR/DOR: fee capped by interest in first period, full fee later", () => {
  assert.equal(calc("ROR", { months: 1 }).totalValue, 100)
  assert.equal(calc("DOR", { months: 1 }).totalValue, 100)
  // First coupon 0.33, tax 0.07; second period has zero interest and a 0.50 fee.
  assert.equal(calc("ROR", { months: 2, nbpRate: 0 }).totalValue, 99.76)
})

test("TOS: official maturity value 113.79 zł before tax", () => {
  const result = calc("TOS", { months: 36 })
  assert.equal(result.grossInterest, 13.79)
  assert.equal(result.tax, 2.63)
  assert.equal(result.totalValue, 111.16)
})

test("capitalizing bonds: fees reduce taxable interest and cannot consume principal", () => {
  for (const name of ["TOS", "EDO", "ROS", "ROD"]) {
    assert.equal(calc(name, { months: 1 }).totalValue, 100)
  }
  const result = calc("EDO", { months: 24, inflation: 8 })
  // 100*1.0535*1.10 = 115.885 -> 115.89; fee 3; tax ceil(12.89*19%) = 2.45.
  assert.equal(result.grossInterest, 15.89)
  assert.equal(result.fees, 3)
  assert.equal(result.tax, 2.45)
  assert.equal(result.totalValue, 110.44)
  assert.deepEqual(calc("EDO", { months: 24, inflation: 8, autoReinvest: true }), result)
})

test("COI: annual coupons are not capitalized and tax is charged at each payout", () => {
  const result = calc("COI", { months: 48 })
  assert.equal(result.grossInterest, 16.75)
  assert.equal(result.tax, 3.19)
  assert.equal(result.totalValue, 113.56)
  assert.equal(calc("COI", { months: 12 }).totalValue, 102.22)
})

test("COI: later-period fee can consume principal; past coupon tax is not refunded", () => {
  const result = calc("COI", { months: 13 })
  // First coupon 4.75 - 0.91; next 30/366 * 4 = 0.33, less full 2 zł fee.
  assert.equal(result.grossInterest, 5.08)
  assert.equal(result.tax, 0.91)
  assert.equal(result.fees, 2)
  assert.equal(result.totalValue, 102.17)
})

test("deflation floors the inflation component, without reducing the contractual margin", () => {
  for (const name of ["COI", "EDO", "ROS", "ROD"]) {
    assert.deepEqual(calc(name, { months: 24, inflation: -10 }), calc(name, { months: 24, inflation: 0 }))
  }
})

test("partial annual periods use actual days including leap years", () => {
  // 2027-11-01 to 2028-05-01 = 182 days, annual period = 366 days.
  const result = calc("EDO", { purchaseDate: "2027-11-01", months: 6 })
  assert.equal(result.grossInterest, 2.66)
  assert.equal(result.totalValue, 100)
  assert.equal(addMonths(new Date("2026-11-30T00:00:00Z"), 3).toISOString().slice(0, 10), "2027-02-28")
})

test("without reinvestment, funds stop earning at maturity", () => {
  assert.deepEqual(calc("ROR", { months: 144 }), calc("ROR", { months: 12 }))
})

test("reinvestment buys whole bonds at maturity, retaining coupons and cash", () => {
  const result = calc("TOS", { investment: 10_000, months: 72, autoReinvest: true })
  assert.equal(result.purchaseRounds.length, 2)
  assert.equal(result.purchaseRounds[0].capitalEnd, 11116.99)
  assert.equal(result.purchaseRounds[1].bondCount, 111)
  assert.equal(result.totalValue, 12356.84)
  assert.equal(result.fees, 0)
})

test("family bonds stop at maturity instead of assuming fresh 800+ allowance", () => {
  const result = calc("ROS", { months: 144, autoReinvest: true })
  assert.equal(result.purchaseRounds.length, 1)
  assert.equal(result.familyReinvestmentSkipped, true)
  assert.equal(result.totalValue, calc("ROS", { months: 72 }).totalValue)
})

test("full-cycle inflation-linked results match independent decimal calculations", () => {
  // Fixed reference values computed with decimal arithmetic, inflation 2.5%.
  const examples = [
    { name: "EDO", months: 120, gross: 56.56, tax: 10.75, total: 145.81 },
    { name: "ROS", months: 72, gross: 30.85, tax: 5.87, total: 124.98 },
    { name: "ROD", months: 144, gross: 80.61, tax: 15.32, total: 165.29 },
  ]
  for (const example of examples) {
    const result = calc(example.name, { months: example.months })
    assert.equal(result.grossInterest, example.gross)
    assert.equal(result.tax, example.tax)
    assert.equal(result.totalValue, example.total)
  }
})

test("money reconciles for all bonds, every horizon and both reinvestment settings", () => {
  for (const item of BONDS) for (let months = 1; months <= 144; months++) for (const autoReinvest of [false, true]) {
    const result = calculateReturn(item, { ...defaults, investment: 10_057.31, months, autoReinvest })
    const cents = (value: number) => Math.round(value * 100)
    assert.equal(cents(result.totalValue), 1005731 + cents(result.grossInterest) - cents(result.tax) - cents(result.fees))
    assert.ok(Number.isFinite(result.totalValue))
    assert.ok(result.purchaseRounds.every((round) => Number.isInteger(round.bondCount)))
  }
})

test("zero horizon and sub-nominal capital stay in cash; invalid inputs fail clearly", () => {
  assert.equal(calc("TOS", { months: 0 }).totalValue, 100)
  assert.equal(calc("ROR", { investment: 99 }).totalValue, 99)
  for (const changes of [{ investment: NaN }, { months: 1.5 }, { months: 145 }, { investment: -1 }, { nbpRate: Infinity }, { purchaseDate: "2026-02-30" }]) {
    assert.throws(() => calc("ROR", changes), RangeError)
  }
})

test("the dated offer has eight distinct, correctly linked issues", () => {
  assert.equal(BONDS.length, 8)
  assert.equal(new Set(BONDS.map((item) => item.series)).size, 8)
  for (const item of BONDS) {
    assert.ok(item.detailsUrl.endsWith(`/${item.series.toLowerCase()}/`))
    assert.equal(item.purchasePrice, 100)
    assert.equal(item.earlyWithdrawalPossible, true)
  }
  assert.equal(OFFER.month, OFFER.validFrom.slice(0, 7))
  assert.equal(isOfferCurrent(new Date("2026-10-31T23:30:00Z")), true)
  assert.equal(isOfferCurrent(new Date("2026-12-01T00:00:00Z")), false)
})
