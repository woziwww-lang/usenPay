import { expect, test } from "@playwright/test";

test("shows the SSR dashboard and client-side order filter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MEGURO KITCHEN LAB" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Table availability" })).toBeVisible();
  await expect(page.getByText("G-238")).toBeVisible();

  await page.getByRole("button", { name: "ready" }).click();
  await expect(page.getByRole("heading", { name: "ORD-1049" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ORD-1048" })).toBeHidden();
});

test("unlocks manager checkout and opens mypage micro frontend", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Settle bill" })).toBeDisabled();

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Administrator")).toBeVisible();
  await expect(page.getByRole("button", { name: "Settle bill" })).toBeEnabled();

  await page.getByRole("link", { name: "MyPage" }).click();
  await expect(page.getByRole("heading", { name: "Store administration" })).toBeVisible();
  await page.getByRole("link", { name: "Discounts" }).click();
  await expect(page.getByRole("heading", { name: "Discount management" })).toBeVisible();
});
