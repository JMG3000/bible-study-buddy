"use client";

export function PrintCurrentPageButton() {
  return (
    <button type="button" className="button-secondary no-print" onClick={() => window.print()}>
      Print saved handout
    </button>
  );
}
