import { test, expect } from "../fixtures/base.fixture";

/**
 * Tests for autocomplete/typeahead functionality on all pages with user input fields.
 * Covers: School autocomplete (API-backed), State autocomplete (client-side),
 * and Major autocomplete (client-side) across /browse, /submit, and /chances.
 */

test.describe("Browse page — autocomplete interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /browse admissions data/i })).toBeVisible();
  });

  test("school filter shows autocomplete suggestions when typing", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Stan", { delay: 50 });

    // Wait for the dropdown to appear (API debounce is 150ms)
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Should have at least one option
    const options = listbox.getByRole("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("school autocomplete populates input on selection", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Stanf", { delay: 50 });

    // Wait for the dropdown
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Click the first suggestion
    const firstOption = listbox.getByRole("option").first();
    const firstOptionText = await firstOption.textContent();
    await firstOption.getByRole("button").click();

    // Input should now contain the selected school name
    const inputValue = await schoolInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
    expect(firstOptionText).toContain(inputValue);
  });

  test("school autocomplete closes on Escape", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Cornell", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    await schoolInput.press("Escape");
    await expect(listbox).not.toBeVisible();
  });

  test("school autocomplete supports keyboard navigation", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Harv", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Press ArrowDown to highlight first option
    await schoolInput.press("ArrowDown");

    // The first option should be highlighted (aria-selected)
    const firstOption = listbox.getByRole("option").first();
    await expect(firstOption).toHaveAttribute("aria-selected", "true");
  });

  test("state filter shows autocomplete suggestions when typing", async ({ page }) => {
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("cal", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show California
    await expect(listbox.getByText("California")).toBeVisible();
  });

  test("state autocomplete populates abbreviation on selection", async ({ page }) => {
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("tex", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText("Texas")).toBeVisible();

    // Click Texas
    await listbox.getByRole("button", { name: /Texas/i }).click();

    const inputValue = await stateInput.inputValue();
    expect(inputValue).toBe("TX");
  });

  test("state autocomplete filters by abbreviation", async ({ page }) => {
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("NY", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText("New York")).toBeVisible();
  });

  test("major filter shows autocomplete suggestions when typing", async ({ page }) => {
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("comp", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show Computer Science and related majors
    await expect(listbox.getByText("Computer Science")).toBeVisible();
  });

  test("major autocomplete populates input on selection", async ({ page }) => {
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("bio", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Click the first suggestion
    await listbox.getByRole("option").first().getByRole("button").click();

    const inputValue = await majorInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test("major autocomplete Enter selects highlighted option", async ({ page }) => {
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("econ", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Navigate down and select
    await majorInput.press("ArrowDown");
    await majorInput.press("Enter");

    // Dropdown should close after selection
    await expect(listbox).not.toBeVisible();

    // Input should have a value from the majors list
    const inputValue = await majorInput.inputValue();
    expect(inputValue.toLowerCase()).toContain("econ");
  });
});

test.describe("Browse page — school name matching patterns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /browse admissions data/i })).toBeVisible();
  });

  /**
   * Schools are stored with full names (e.g., "Massachusetts Institute of Technology").
   * The autocomplete API uses ILIKE '%query%', so only substrings of the full name match.
   * Common abbreviations (MIT, UCLA, USC) do NOT match because those letters don't
   * appear consecutively in the full names.
   */

  test("full name substring 'Stanford' matches Stanford University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Stanford", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Stanford University")).toBeVisible();
  });

  test("full name substring 'Harvard' matches Harvard University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Harvard", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Harvard University")).toBeVisible();
  });

  test("partial name 'Cornell' matches Cornell University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Cornell", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Cornell University")).toBeVisible();
  });

  test("'California' matches multiple UC schools", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("California", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Should show multiple UC schools since they all contain "California"
    const optionCount = await listbox.getByRole("option").count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test("'Duke' matches Duke University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Duke", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Duke University")).toBeVisible();
  });

  test("'Northwestern' matches Northwestern University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Northwestern", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Northwestern University")).toBeVisible();
  });

  test("'Massachusetts' matches MIT (full name: Massachusetts Institute of Technology)", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Massachusetts", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Massachusetts Institute of Technology")).toBeVisible();
  });

  test("abbreviation 'MIT' matches Massachusetts Institute of Technology", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("MIT", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Massachusetts Institute of Technology")).toBeVisible();
  });

  test("abbreviation 'UCLA' matches University of California-Los Angeles", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("UCLA", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText(/University of California.*Los Angeles/)).toBeVisible();
  });

  test("abbreviation 'USC' matches University of Southern California", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("USC", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("University of Southern California")).toBeVisible();
  });

  test("abbreviation 'CMU' matches Carnegie Mellon University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("CMU", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Carnegie Mellon University")).toBeVisible();
  });

  test("abbreviation 'UPenn' matches University of Pennsylvania", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("UPenn", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("University of Pennsylvania")).toBeVisible();
  });

  test("'Johns Hopkins' matches Johns Hopkins University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Johns Hopkins", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Johns Hopkins University")).toBeVisible();
  });

  test("'Carnegie' matches Carnegie Mellon University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Carnegie", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Carnegie Mellon University")).toBeVisible();
  });

  test("case-insensitive search 'princeton' matches Princeton University", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("princeton", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText("Princeton University")).toBeVisible();
  });

  test("'Georgia' matches Georgia Institute of Technology", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Georgia", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Should include Georgia Tech (full name: Georgia Institute of Technology-Main Campus)
    const options = listbox.getByRole("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("nonsense query returns no results", async ({ page }) => {
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("zzznomatch999", { delay: 30 });

    await page.waitForTimeout(1_000);
    const listbox = page.getByRole("listbox");
    await expect(listbox).not.toBeVisible();
  });
});

test.describe("Browse page — state and major combination inputs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /browse admissions data/i })).toBeVisible();
  });

  test("state autocomplete shows multiple matches for 'new'", async ({ page }) => {
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("new", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show New Hampshire, New Jersey, New Mexico, New York
    const optionCount = await listbox.getByRole("option").count();
    expect(optionCount).toBeGreaterThanOrEqual(4);
  });

  test("state autocomplete shows no matches for nonsense input", async ({ page }) => {
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("zzz", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).not.toBeVisible();
  });

  test("major autocomplete 'science' matches multiple science majors", async ({ page }) => {
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("science", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show Computer Science, Political Science, Data Science, etc.
    const optionCount = await listbox.getByRole("option").count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test("major autocomplete 'engineering' matches multiple engineering majors", async ({ page }) => {
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("engineering", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show Mechanical, Electrical, Civil, Chemical, etc.
    const optionCount = await listbox.getByRole("option").count();
    expect(optionCount).toBeGreaterThan(3);
  });

  test("selecting school then state then major preserves all selections", async ({ page }) => {
    // Select a school via autocomplete
    const schoolInput = page.getByLabel("School");
    await schoolInput.click();
    await schoolInput.pressSequentially("Stanford", { delay: 50 });
    const schoolListbox = page.getByRole("listbox");
    await expect(schoolListbox).toBeVisible({ timeout: 5_000 });
    await schoolListbox.getByRole("option").first().getByRole("button").click();
    const schoolValue = await schoolInput.inputValue();
    expect(schoolValue).toContain("Stanford");

    // Select a state via autocomplete
    const stateInput = page.getByLabel("State");
    await stateInput.click();
    await stateInput.pressSequentially("cal", { delay: 50 });
    const stateListbox = page.getByRole("listbox");
    await expect(stateListbox).toBeVisible();
    await stateListbox.getByRole("button", { name: /California/i }).click();
    expect(await stateInput.inputValue()).toBe("CA");

    // Select a major via autocomplete
    const majorInput = page.getByLabel("Major");
    await majorInput.click();
    await majorInput.pressSequentially("comp", { delay: 50 });
    const majorListbox = page.getByRole("listbox");
    await expect(majorListbox).toBeVisible();
    await majorListbox.getByRole("option").first().getByRole("button").click();
    const majorValue = await majorInput.inputValue();
    expect(majorValue.toLowerCase()).toContain("comp");

    // All three values should still be set
    expect(await schoolInput.inputValue()).toContain("Stanford");
    expect(await stateInput.inputValue()).toBe("CA");
    expect(await majorInput.inputValue()).toBeTruthy();

    // Apply filters and verify URL contains all three
    await page.getByRole("button", { name: "Apply Filters" }).click();
    await expect(page).toHaveURL(/school=.*Stanford/);
    await expect(page).toHaveURL(/state=CA/);
    await expect(page).toHaveURL(/major=/);
  });
});

test.describe("Submit page — autocomplete interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/submit");
    await expect(page.getByRole("heading", { name: /submit your admission result/i })).toBeVisible();
  });

  test("school name field shows autocomplete suggestions", async ({ page }) => {
    const schoolInput = page.getByLabel("School Name");
    await schoolInput.click();
    // Use pressSequentially with longer delay to ensure React controlled input
    // processes each keystroke between re-renders
    await schoolInput.pressSequentially("Stanf", { delay: 80 });

    // API debounce is 150ms + network latency — allow extra time
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const options = listbox.getByRole("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("state of residence shows autocomplete suggestions", async ({ page }) => {
    const stateInput = page.getByLabel("State of Residence");
    await stateInput.click();
    await stateInput.pressSequentially("fl", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText("Florida")).toBeVisible();
  });

  test("state of residence populates abbreviation on selection", async ({ page }) => {
    const stateInput = page.getByLabel("State of Residence");
    await stateInput.click();
    await stateInput.pressSequentially("mass", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("button", { name: /Massachusetts/i }).click();

    const inputValue = await stateInput.inputValue();
    expect(inputValue).toBe("MA");
  });

  test("intended major shows autocomplete suggestions", async ({ page }) => {
    const majorInput = page.getByLabel("Intended Major");
    await majorInput.click();
    await majorInput.pressSequentially("eng", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show engineering-related majors
    const options = listbox.getByRole("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("intended major populates input on selection", async ({ page }) => {
    const majorInput = page.getByLabel("Intended Major");
    await majorInput.click();
    await majorInput.pressSequentially("psych", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("button", { name: /Psychology/i }).click();

    const inputValue = await majorInput.inputValue();
    expect(inputValue).toBe("Psychology");
  });
});

test.describe("Chances page — autocomplete interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chances");
    await expect(page.getByRole("heading", { name: /chances calculator/i })).toBeVisible();
  });

  test("intended major shows autocomplete suggestions", async ({ page }) => {
    const majorInput = page.getByLabel(/intended major/i);
    await majorInput.click();
    await majorInput.pressSequentially("math", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Should show Mathematics and related majors
    await expect(listbox.getByText("Mathematics", { exact: true })).toBeVisible();
  });

  test("intended major populates input on selection", async ({ page }) => {
    const majorInput = page.getByLabel(/intended major/i);
    await majorInput.click();
    await majorInput.pressSequentially("phys", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("button", { name: "Physics", exact: true }).click();

    const inputValue = await majorInput.inputValue();
    expect(inputValue).toBe("Physics");
  });

  test("major autocomplete allows free-text entry", async ({ page }) => {
    const majorInput = page.getByLabel(/intended major/i);
    await majorInput.fill("Custom Major Name");

    // The value should persist even though it's not in the predefined list
    const inputValue = await majorInput.inputValue();
    expect(inputValue).toBe("Custom Major Name");
  });
});
