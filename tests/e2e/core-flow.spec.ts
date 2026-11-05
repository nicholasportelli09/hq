import { expect, test } from "@playwright/test";

test("a team creates a room and changes sync live to a teammate's tab", async ({ context }) => {
  // Arrange: create a room
  const host = await context.newPage();
  await host.goto("/");
  await host.getByLabel("Team").fill("Northern Lights");
  await host.getByLabel("Your name").fill("Ada Lovelace");
  await host.getByRole("button", { name: "Start the clock" }).click();
  await expect(host).toHaveURL(/\/r\/[a-z0-9]{12}$/);
  await expect(host.getByRole("heading", { name: "Northern Lights" })).toBeVisible();
  await expect(host.getByRole("timer")).toBeVisible();

  const guest = await context.newPage();
  await guest.goto(host.url());
  await expect(guest.getByText("Nothing yet.")).toBeVisible();

  // Act: add a task with the keyboard, claim it, add and lock an idea
  await host.keyboard.press("n");
  await host.keyboard.type("Ship the demo");
  await host.keyboard.press("Enter");
  await host.getByRole("button", { name: "Claim task" }).click();

  await host.getByLabel("New idea").fill("Carbon receipts");
  await host.getByLabel("New idea").press("Enter");
  await host.getByRole("button", { name: /^Vote for Carbon receipts/ }).click();
  await host.getByRole("button", { name: "Lock in" }).click();

  // Assert: the teammate sees all of it without reloading
  await expect(guest.getByText("Ship the demo")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Unclaim task" })).toBeVisible();
  await expect(guest.getByText("We're building")).toBeVisible();
  await expect(guest.getByText("Carbon receipts")).toBeVisible();
  await expect(guest.getByText("1 vote · pitched by Ada Lovelace")).toBeVisible();

  // And completing a task from the guest syncs back
  await guest.getByRole("checkbox", { name: "Mark as done" }).click();
  await expect(host.getByText("0 open · 1 done")).toBeVisible();
});

test("the shortcuts sheet opens with ? and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Team").fill("Keys");
  await page.getByLabel("Your name").fill("Grace Hopper");
  await page.getByRole("button", { name: "Start the clock" }).click();
  await expect(page).toHaveURL(/\/r\/[a-z0-9]{12}$/);
  await expect(page.getByRole("timer")).toBeVisible();

  await page.keyboard.press("?");
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();

  // Shortcuts must not fire behind the open sheet
  await page.keyboard.press("n");
  await expect(page.getByLabel("New task")).not.toBeFocused();

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("an idea can be deleted, and it disappears for teammates too", async ({ context }) => {
  const host = await context.newPage();
  await host.goto("/");
  await host.getByLabel("Team").fill("Ideas");
  await host.getByLabel("Your name").fill("Ada Lovelace");
  await host.getByRole("button", { name: "Start the clock" }).click();
  await expect(host).toHaveURL(/\/r\/[a-z0-9]{12}$/);

  await host.getByLabel("New idea").fill("Typo idea");
  await host.getByLabel("New idea").press("Enter");
  await host.getByLabel("New idea").fill("Keep this one");
  await host.getByLabel("New idea").press("Enter");

  const guest = await context.newPage();
  await guest.goto(host.url());
  await expect(guest.getByText("Typo idea")).toBeVisible();

  await host.getByRole("button", { name: "Delete idea: Typo idea" }).click();

  await expect(host.getByText("Typo idea")).toHaveCount(0);
  await expect(guest.getByText("Typo idea")).toHaveCount(0);
  await expect(guest.getByText("Keep this one")).toBeVisible();
});

test("an invalid room link shows a not-found page", async ({ page }) => {
  await page.goto("/r/not-a-room");
  await expect(page.getByRole("heading", { name: "No room here." })).toBeVisible();
});
