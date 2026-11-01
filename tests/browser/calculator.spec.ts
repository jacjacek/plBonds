import { test, expect } from "@playwright/test"

test("amount updates results, comma decimals work, whole bonds and details reconcile", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("response", (response) => {
    if (response.url().startsWith("http://127.0.0.1:3000") && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("lang", "pl")
  const ots = page.getByTestId("bond-OTS")
  await expect(ots.getByTestId("profit")).toContainText("405,00")
  if (test.info().project.name === "desktop") {
    const label = await page.getByText("Porównaj obligacje", { exact: true }).boundingBox()
    expect(label!.x).toBeGreaterThanOrEqual(0)
  }
  await page.screenshot({ path: `test-results/default-${test.info().project.name}.png`, fullPage: true })
  const amount = page.getByLabel("Kwota inwestycji (PLN)")
  await amount.fill("199,99")
  await amount.press("Enter")
  await expect(ots.getByTestId("profit")).toContainText("0,40")
  await ots.locator("summary").click()
  await expect(ots.getByTestId("breakdown")).toContainText("200,39")
  await expect(ots.getByTestId("breakdown")).toContainText("1 szt.")
  await expect(page.getByTestId("bond-ROD")).toHaveCount(0)
  await page.getByRole("switch", { name: "Wyklucz obligacje rodzinne" }).click()
  await expect(page.getByTestId("bond-ROD")).toHaveCount(1)
  await expect(page.getByTestId("bond-ROS")).toHaveCount(1)
  if (test.info().project.name === "mobile") {
    await page.locator('[aria-label="Porównanie obligacji"]').evaluate((element) => { element.scrollLeft = 0 })
    const firstCard = await page.locator('[data-testid^="bond-"]').first().boundingBox()
    expect(firstCard!.x).toBeGreaterThanOrEqual(0)
    expect(firstCard!.x + firstCard!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
  expect(errors).toEqual([])
})

test("horizon, inflation, NBP assumptions and reinvestment change results", async ({ page }) => {
  await page.goto("/")
  const nbp = page.getByLabel("Założona przyszła stopa NBP (%)")
  const ror = page.getByTestId("bond-ROR").getByTestId("profit")
  const before = await ror.innerText()
  await nbp.fill("6")
  await nbp.press("Enter")
  await expect(ror).not.toHaveText(before)
  const slider = page.getByRole("slider")
  await slider.focus()
  await slider.press("Home")
  await expect(slider).toHaveAttribute("aria-valuenow", "1")
  await expect(page.getByTestId("bond-EDO").getByTestId("profit")).toContainText("0,00")
  await slider.press("End")
  await expect(slider).toHaveAttribute("aria-valuenow", "144")
  const edo = page.getByTestId("bond-EDO").getByTestId("profit")
  const previous = await edo.innerText()
  await page.getByLabel("Założona przyszła inflacja roczna (%)").fill("-2")
  await page.getByLabel("Założona przyszła inflacja roczna (%)").press("Enter")
  await expect(edo).not.toHaveText(previous)
  const ots = page.getByTestId("bond-OTS").getByTestId("profit")
  const old = await ots.innerText()
  await page.getByRole("switch", { name: "Reinwestowanie po wykupie" }).click()
  await expect(ots).not.toHaveText(old)
  await page.screenshot({ path: `test-results/calculator-${test.info().project.name}.png`, fullPage: true })
})

test("expired offer displays an archive warning in the exported static site", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-05T12:00:00Z"))
  await page.goto("/")
  await expect(page.getByRole("status")).toContainText("Ta oferta jest archiwalna")
})
