import { COMMON_PRONOUN_SETS, PronounType, SPECIAL_PRONOUN_SETS } from "./pronounUtils";
import { createEvent, fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";

import { PronounDisplay } from "./PronounDisplay";
import { darkTheme } from "./theme";

const THEY_FORMS = /\b(they|them|their|theirs|themselves)\b/i;
const MODES = [
  { name: "short", props: { format: "short" } },
  { name: "medium", props: { format: "medium" } },
  { name: "long", props: { format: "long" } },
  { name: "badges", props: { displayMode: "badges" } },
] as const;
const HIDDEN_BY_DEFAULT = {
  "exclude: true": { ...COMMON_PRONOUN_SETS.THEY, exclude: true },
  "exc: true": { ...COMMON_PRONOUN_SETS.THEY, exc: true },
  "privacy: 1": { ...COMMON_PRONOUN_SETS.THEY, privacy: 1 },
  "pvc: 1": { ...COMMON_PRONOUN_SETS.THEY, pvc: 1 },
};

describe("PronounDisplay", () => {
  test("renders nothing when pronouns array is empty", () => {
    const { container } = render(<PronounDisplay pronouns={[]} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders a single pronoun set in short format", () => {
    render(<PronounDisplay pronouns={[COMMON_PRONOUN_SETS.SHE]} />);
    expect(screen.getByText(/she\/her/i)).toBeDefined();
  });

  test("renders multiple pronoun sets with separator", () => {
    render(
      <PronounDisplay
        pronouns={[COMMON_PRONOUN_SETS.SHE, COMMON_PRONOUN_SETS.THEY]}
        separator=" / "
      />,
    );
    // Visible text uses slash notation; aria-label uses comma notation for screen readers
    expect(screen.getByText(/she\/her/i)).toBeDefined();
    // Accessible label uses comma-separated form (no slashes read aloud)
    expect(screen.getByLabelText(/she, her/i)).toBeDefined();
  });

  test("renders in long format", () => {
    render(<PronounDisplay format="long" pronouns={[COMMON_PRONOUN_SETS.HE]} />);
    // Long format (expanded): subjective/objective/possessive_pronoun
    expect(screen.getByText(/he\/him\/his/i)).toBeDefined();
  });

  test("handles special pronoun types", () => {
    render(
      <PronounDisplay
        pronouns={[SPECIAL_PRONOUN_SETS.ANY, SPECIAL_PRONOUN_SETS.NONE, SPECIAL_PRONOUN_SETS.ASK]}
      />,
    );
    expect(screen.getByText(/any pronouns/i)).toBeDefined();
    expect(screen.getByText(/no pronouns/i)).toBeDefined();
    expect(screen.getByText(/ask me/i)).toBeDefined();
  });

  test("handles UNSPECIFIED special type", () => {
    render(<PronounDisplay pronouns={[{ type: PronounType.UNSPECIFIED }]} />);
    expect(screen.getByText(/unspecified/i)).toBeDefined();
  });

  test("renders with custom aria-label", () => {
    render(<PronounDisplay aria-label="User pronouns" pronouns={[COMMON_PRONOUN_SETS.THEY]} />);
    expect(screen.getByLabelText("User pronouns")).toBeDefined();
  });

  test("renders as a different element type", () => {
    const { container } = render(<PronounDisplay as="div" pronouns={[COMMON_PRONOUN_SETS.HE]} />);
    expect(container.querySelector("div")).toBeDefined();
  });

  test("renders with dark theme", () => {
    render(<PronounDisplay pronouns={[COMMON_PRONOUN_SETS.SHE]} theme={darkTheme} />);
    expect(screen.getByText(/she\/her/i)).toBeDefined();
  });

  test("renders with showExamples and expands on click", () => {
    render(<PronounDisplay pronouns={[COMMON_PRONOUN_SETS.THEY]} showExamples />);

    // Should have a clickable element
    const button = screen.getByRole("button");
    expect(button).toBeDefined();

    // Click to expand examples
    fireEvent.click(button);

    // Should show example sentences in the expanded disclosure panel
    const tooltip = document.querySelector(".pronoun-display-tooltip");
    expect(tooltip).toBeDefined();
  });

  test("applies className prop", () => {
    const { container } = render(
      <PronounDisplay className="custom-class" pronouns={[COMMON_PRONOUN_SETS.HE]} />,
    );
    expect(container.querySelector(".custom-class")).toBeDefined();
  });

  test("applies classNames to sub-elements", () => {
    const { container } = render(
      <PronounDisplay
        classNames={{
          pronounText: "custom-text",
          pronounWrapper: "custom-wrapper",
          root: "custom-root",
        }}
        pronouns={[COMMON_PRONOUN_SETS.SHE]}
        showExamples={true}
      />,
    );
    expect(container.querySelector(".pronoun-display.custom-root")).toBeDefined();
    expect(container.querySelector(".pronoun-display-pronoun.custom-wrapper")).toBeDefined();
    expect(container.querySelector(".pronoun-display-text.custom-text")).toBeDefined();
  });

  test("classNames works alongside className prop", () => {
    const { container } = render(
      <PronounDisplay
        className="external-class"
        classNames={{
          root: "custom-root",
        }}
        pronouns={[COMMON_PRONOUN_SETS.SHE]}
      />,
    );
    const root = container.querySelector(".pronoun-display.external-class.custom-root");
    expect(root).toBeDefined();
  });

  test("renders with default classes when classNames not provided", () => {
    const { container } = render(
      <PronounDisplay pronouns={[COMMON_PRONOUN_SETS.SHE]} showExamples={true} />,
    );
    expect(container.querySelector(".pronoun-display")).toBeDefined();
    expect(container.querySelector(".pronoun-display-pronoun")).toBeDefined();
  });

  describe.each(MODES)("hidden sets in $name mode", ({ props }) => {
    test.each(Object.entries(HIDDEN_BY_DEFAULT))("omits %s", (_reason, hidden) => {
      const { container } = render(
        <PronounDisplay {...props} pronouns={[COMMON_PRONOUN_SETS.SHE, hidden]} />,
      );
      expect(container.innerHTML).toMatch(/she/i); // positive control
      expect(container.innerHTML).not.toMatch(THEY_FORMS); // text + attributes
    });
  });

  test("privacy: 0 is still displayed", () => {
    const { container } = render(
      <PronounDisplay pronouns={[{ ...COMMON_PRONOUN_SETS.THEY, privacy: 0 }]} />,
    );
    expect(container.textContent).toContain("They/Them");
  });

  test("shows privacy >= 1 entries when publicOnly={false}, but still shows the public set", () => {
    const { container } = render(
      <PronounDisplay
        publicOnly={false}
        pronouns={[COMMON_PRONOUN_SETS.SHE, { ...COMMON_PRONOUN_SETS.THEY, privacy: 1 }]}
      />,
    );
    expect(container.textContent).toMatch(/she/i);
    expect(container.textContent).toContain("They/Them");
  });

  test("omits excluded entries even when publicOnly={false}, but still shows the public set", () => {
    const excluded = { ...COMMON_PRONOUN_SETS.THEY, exclude: true };
    const { container } = render(
      <PronounDisplay publicOnly={false} pronouns={[COMMON_PRONOUN_SETS.SHE, excluded]} />,
    );
    expect(container.textContent).toMatch(/she/i);
    expect(container.textContent).not.toMatch(THEY_FORMS);
  });

  describe("originalText popover", () => {
    const setup = () => {
      const utils = render(
        <PronounDisplay
          pronouns={[COMMON_PRONOUN_SETS.SHE]}
          originalText="(in professional settings)"
        />,
      );
      const toggle = screen.getByRole("button", { name: /show original text/i });
      return { ...utils, toggle };
    };

    test("is collapsed by default", () => {
      const { toggle } = setup();
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("(in professional settings)")).toBeNull();
    });

    test("expands on click and wires aria-controls to the popover", () => {
      const { toggle, container } = setup();
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      const popover = container.querySelector(".pronoun-display-original-text-popover");
      expect(popover).not.toBeNull();
      expect(popover?.id).toBe(toggle.getAttribute("aria-controls"));
      expect(screen.getByText("(in professional settings)")).toBeDefined();
    });

    test("collapses on second click", () => {
      const { toggle } = setup();
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("(in professional settings)")).toBeNull();
    });

    test("renders no toggle without originalText", () => {
      render(<PronounDisplay pronouns={[COMMON_PRONOUN_SETS.SHE]} />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("displayMode='badges'", () => {
    test("renders under the badges root with a comma-separated aria-label", () => {
      const { container } = render(
        <PronounDisplay displayMode="badges" pronouns={[COMMON_PRONOUN_SETS.SHE]} />,
      );
      const root = container.querySelector(".pronoun-display--badges");
      expect(root).not.toBeNull();
      expect(root?.getAttribute("aria-label")).toMatch(/she, her/i);
    });
  });

  describe("showExamples disclosure", () => {
    const setup = () => {
      const utils = render(<PronounDisplay pronouns={[COMMON_PRONOUN_SETS.SHE]} showExamples />);
      const toggle = screen.getByRole("button", { name: /show examples/i });
      return { ...utils, toggle };
    };

    const tooltip = (c: Element) => c.querySelector(".pronoun-display-tooltip");

    test("expands on click, collapses on second click", () => {
      const { toggle, container } = setup();
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(tooltip(container)).toBeNull();

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(tooltip(container)?.id).toBe(toggle.getAttribute("aria-controls"));

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(tooltip(container)).toBeNull();
    });

    test.each(["Enter", " "])("toggles with the %j key", (key) => {
      const { toggle, container } = setup();
      fireEvent.keyDown(toggle, { key });
      expect(tooltip(container)).not.toBeNull();
      fireEvent.keyDown(toggle, { key });
      expect(tooltip(container)).toBeNull();
    });

    test("other keys do nothing", () => {
      const { toggle, container } = setup();
      fireEvent.keyDown(toggle, { key: "a" });
      expect(tooltip(container)).toBeNull();
    });

    test("prevents default on Space so the page doesn't scroll", () => {
      const { toggle } = setup();
      const event = createEvent.keyDown(toggle, { key: " " });
      fireEvent(toggle, event);
      expect(event.defaultPrevented).toBe(true);
    });

    test("special types are not expandable", () => {
      render(<PronounDisplay pronouns={[SPECIAL_PRONOUN_SETS.ANY]} showExamples />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    test("examples never leak a hidden set, and filtering doesn't misalign the index", () => {
      // hidden set first, so SHE is displayable index 0 but pronouns index 1
      const { container } = render(
        <PronounDisplay
          pronouns={[{ ...COMMON_PRONOUN_SETS.THEY, privacy: 1 }, COMMON_PRONOUN_SETS.SHE]}
          showExamples
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /show examples/i }));
      const t = container.querySelector(".pronoun-display-tooltip");
      expect(t?.textContent).toMatch(/\S/); // positive control
      expect(t?.textContent).not.toMatch(THEY_FORMS);
    });
  });

  test.each([
    ["short", "She/Her"],
    ["medium", "She/Her/Hers"],
    ["long", "She/Her/Hers"],
  ] as const)("renders SHE in %s format as %s", (format, expected) => {
    const { container } = render(
      <PronounDisplay format={format} pronouns={[COMMON_PRONOUN_SETS.SHE]} />,
    );
    expect(container.textContent).toBe(expected);
  });

  test("badges mode renders the OriginalTextBadge when originalText is provided", () => {
    const { container } = render(
      <PronounDisplay
        displayMode="badges"
        pronouns={[COMMON_PRONOUN_SETS.SHE]}
        originalText="(in professional settings)"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show original text/i }));
    expect(container.querySelector(".original-text-badge-popover")).not.toBeNull();
    expect(screen.getByText("(in professional settings)")).not.toBeNull();
  });
});
