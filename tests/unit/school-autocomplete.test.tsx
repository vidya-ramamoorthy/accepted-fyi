import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import SchoolAutocomplete from "@/components/SchoolAutocomplete";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SchoolAutocomplete", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("should render the input field", () => {
    render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
  });

  it("should have proper ARIA attributes for accessibility", () => {
    render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-haspopup", "listbox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("should call onSelect when user types", () => {
    render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Stan" } });

    expect(mockOnSelect).toHaveBeenCalledWith("Stan");
  });

  it("should show suggestions after typing at least 2 characters", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Stanford" } });

    rerender(
      <SchoolAutocomplete
        value="Stanford"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      const listbox = screen.queryByRole("listbox");
      expect(listbox).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("should not show suggestions for single character input", () => {
    render(
      <SchoolAutocomplete value="S" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "S" } });
    vi.advanceTimersByTime(200);

    const listbox = screen.queryByRole("listbox");
    expect(listbox).not.toBeInTheDocument();
  });

  it("should call onSelect with school name and state when suggestion is clicked", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Stanford" } });

    rerender(
      <SchoolAutocomplete
        value="Stanford"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });

    const firstOption = screen.getAllByRole("option")[0];
    const button = firstOption.querySelector("button")!;
    fireEvent.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith("Stanford University", "CA");
  });

  it("should close suggestions when Escape is pressed", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Harvard" } });

    rerender(
      <SchoolAutocomplete
        value="Harvard"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should support keyboard navigation with ArrowDown and ArrowUp", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Brown" } });

    rerender(
      <SchoolAutocomplete
        value="Brown"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveAttribute("aria-selected", "true");
  });

  it("should select highlighted item on Enter", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Yale" } });

    rerender(
      <SchoolAutocomplete
        value="Yale"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnSelect).toHaveBeenCalledWith("Yale University", "CT");
  });

  it("should display school state alongside name in suggestions", async () => {
    const { rerender } = render(
      <SchoolAutocomplete value="" onSelect={mockOnSelect} id="schoolName" />
    );

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Princeton" } });

    rerender(
      <SchoolAutocomplete
        value="Princeton"
        onSelect={mockOnSelect}
        id="schoolName"
      />
    );

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });

    expect(screen.getByText("NJ")).toBeInTheDocument();
  });

  it("should pass required attribute to the input", () => {
    render(
      <SchoolAutocomplete
        value=""
        onSelect={mockOnSelect}
        id="schoolName"
        required
      />
    );

    const input = screen.getByRole("combobox");
    expect(input).toBeRequired();
  });

  it("should apply custom className to the input", () => {
    render(
      <SchoolAutocomplete
        value=""
        onSelect={mockOnSelect}
        id="schoolName"
        className="custom-class"
      />
    );

    const input = screen.getByRole("combobox");
    expect(input).toHaveClass("custom-class");
  });
});
