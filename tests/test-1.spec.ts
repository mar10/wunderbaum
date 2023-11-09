import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/test/unit/test-dev.html");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/✔ Test Suite (DEV) | Wunderbaum/);
});

// test("test", async ({ page }) => {
//   // Recording...
// });
