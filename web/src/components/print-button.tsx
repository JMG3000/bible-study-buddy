"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="button-secondary"
      onClick={() => window.print()}
    >
      Print handout
    </button>
  );
}
