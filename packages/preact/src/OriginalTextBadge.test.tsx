import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { darkTheme, defaultTheme } from "./theme";

import { OriginalTextBadge } from "./OriginalTextBadge";

const TEXT = "(in professional settings)";
const normalizeColor = (value: string) => {
  const el = document.createElement("div");
  el.style.color = value;
  return el.style.color;
};

const setup = (props: Partial<Parameters<typeof OriginalTextBadge>[0]> = {}) => {
  const utils = render(<OriginalTextBadge originalText={TEXT} {...props} />);
  const toggle = screen.getByRole("button");
  return { ...utils, toggle };
};

const popover = (c: Element) => c.querySelector(".original-text-badge-popover");

describe("OriginalTextBadge", () => {
  describe("disclosure", () => {
    test("is collapsed by default", () => {
      const { toggle, container } = setup();
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.getAttribute("aria-label")).toBe("Show original text");
      expect(popover(container)).toBeNull();
      expect(screen.queryByText(TEXT)).toBeNull();
    });

    test("expands on click and shows the original text", () => {
      const { toggle, container } = setup();
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(toggle.getAttribute("aria-label")).toBe("Hide original text");
      expect(popover(container)).not.toBeNull();
      expect(screen.getByText(TEXT)).not.toBeNull();
      expect(screen.getByText(/original text:/i)).not.toBeNull();
    });

    test("wires aria-controls to the popover id", () => {
      const { toggle, container } = setup();
      fireEvent.click(toggle);
      const id = toggle.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      expect(popover(container)?.id).toBe(id);
    });

    test("collapses on second click", () => {
      const { toggle, container } = setup();
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.getAttribute("aria-label")).toBe("Show original text");
      expect(popover(container)).toBeNull();
      expect(screen.queryByText(TEXT)).toBeNull();
    });

    test("is a non-submitting button", () => {
      const { toggle } = setup();
      expect(toggle.getAttribute("type")).toBe("button");
    });
  });

  describe("content", () => {
    test("renders originalText as text, not markup", () => {
      const hostile = '<img src="x" onerror="alert(1)">';
      const { toggle, container } = setup({ originalText: hostile });
      fireEvent.click(toggle);
      expect(container.querySelector("img")).toBeNull();
      expect(screen.getByText(hostile)).not.toBeNull();
    });

    test("shows updated text when the prop changes", () => {
      const { toggle, rerender } = setup();
      fireEvent.click(toggle);
      rerender(<OriginalTextBadge originalText="she/her at work" />);
      expect(screen.getByText("she/her at work")).not.toBeNull();
      expect(screen.queryByText(TEXT)).toBeNull();
    });
  });

  describe("classNames", () => {
    test("applies default classes", () => {
      const { toggle, container } = setup();
      fireEvent.click(toggle);
      expect(container.querySelector(".original-text-badge")).not.toBeNull();
      expect(container.querySelector(".original-text-badge-icon")).not.toBeNull();
      expect(popover(container)).not.toBeNull();
    });

    test("applies className alongside classNames.root", () => {
      const { container } = setup({ className: "external", classNames: { root: "custom-root" } });
      expect(container.querySelector(".original-text-badge.external.custom-root")).not.toBeNull();
    });

    test("applies classNames.icon and classNames.popover", () => {
      const { toggle, container } = setup({
        classNames: { icon: "custom-icon", popover: "custom-popover" },
      });
      expect(toggle.classList.contains("custom-icon")).toBe(true);
      fireEvent.click(toggle);
      expect(popover(container)?.classList.contains("custom-popover")).toBe(true);
    });
  });

  describe("icons", () => {
    test("renders the default info svg when no icon override is given", () => {
      const { toggle } = setup();
      expect(toggle.querySelector("svg")).not.toBeNull();
    });

    test("renders a custom info icon instead of the default svg", () => {
      const { toggle } = setup({ icons: { info: <span data-testid="custom-info">!</span> } });
      expect(screen.getByTestId("custom-info")).not.toBeNull();
      expect(toggle.querySelector("svg")).toBeNull();
    });
  });

  describe("theme", () => {
    test("applies theme colors to the popover and toggle", () => {
      const { toggle, container } = setup({ theme: darkTheme });
      fireEvent.click(toggle);
      const pop = popover(container) as HTMLElement;
      expect(pop.style.backgroundColor).toBe(normalizeColor(darkTheme.colors.background));
      expect(pop.style.color).toBe(normalizeColor(darkTheme.colors.text));
      expect(toggle.style.color).toBe(normalizeColor(darkTheme.colors.primary));
    });

    test("dark theme differs from the default theme", () => {
      const { toggle, container } = setup({ theme: darkTheme });
      fireEvent.click(toggle);
      const pop = popover(container) as HTMLElement;
      expect(pop.style.backgroundColor).not.toBe(normalizeColor(defaultTheme.colors.background));
    });
  });
});
