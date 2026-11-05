import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function createRoom(context: BrowserContext, opts: { junction?: boolean } = {}): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Team").fill("Feature check");
  await page.getByLabel("Your name").fill("Ada Lovelace");
  if (opts.junction) await page.getByRole("button", { name: /Use its schedule/ }).click();
  await page.getByRole("button", { name: "Start the clock" }).click();
  await expect(page).toHaveURL(/\/r\/[a-z0-9]{12}$/);
  await expect(page.getByRole("timer")).toBeVisible();
  return page;
}

test.describe("in Helsinki", () => {
  // The preset is an absolute instant; on a Finnish laptop it reads 10:00.
  test.use({ timezoneId: "Europe/Helsinki", locale: "en-GB" });

  test("the Junction preset sets the real deadline and schedule", async ({ context }) => {
    const page = await createRoom(context, { junction: true });
    await expect(page.getByRole("button", { name: /^Due Sun.*15 Nov.*10:00$/ })).toBeVisible();
    await expect(page.getByText("Next: Dinner")).toBeVisible();

    await page.keyboard.press("m");
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Draft submission (team count)")).toBeVisible();
    await expect(sheet.getByText("Submissions open")).toBeVisible();
  });
});

test("a custom milestone syncs to teammates", async ({ context }) => {
  const host = await createRoom(context);
  const guest = await context.newPage();
  await guest.goto(host.url());

  await host.getByRole("button", { name: "Milestones" }).click();
  await host.getByPlaceholder("e.g. Feature freeze").fill("Feature freeze");
  await host.getByRole("button", { name: "Add", exact: true }).click();
  await host.keyboard.press("Escape");

  await expect(guest.getByText("Next: Feature freeze")).toBeVisible();
});

test("a deleted task can be undone, for everyone", async ({ context }) => {
  const host = await createRoom(context);
  const guest = await context.newPage();
  await guest.goto(host.url());

  await host.getByLabel("New task").fill("Do not lose me");
  await host.getByLabel("New task").press("Enter");
  await host.getByRole("button", { name: "Claim task" }).click();
  await host.getByRole("button", { name: "Delete" }).click();
  await expect(guest.getByText("Do not lose me")).toHaveCount(0);

  await host.getByRole("button", { name: "Undo" }).click();
  await expect(guest.getByText("Do not lose me")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Unclaim task" })).toBeVisible();
});

test("the submission checklist opens with S and ticks sync", async ({ context }) => {
  const host = await createRoom(context);
  const guest = await context.newPage();
  await guest.goto(host.url());
  await expect(guest.getByText("Before you submit")).toHaveCount(0);

  await host.keyboard.press("s");
  await host.getByRole("checkbox", { name: /2-minute video/ }).click();

  // Once anything is ticked, the checklist shows for the whole team.
  await expect(guest.getByText("Before you submit")).toBeVisible();
  await expect(guest.getByText("1 / 7")).toBeVisible();
});
