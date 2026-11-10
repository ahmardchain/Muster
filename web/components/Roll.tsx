/**
 * The muster roll: one mark per paid place in a quest. Filled marks are
 * wallets the contract has already checked and paid.
 */
export default function Roll({ slots, slotsLeft, size = "sm" }: { slots: number; slotsLeft: number; size?: "sm" | "lg" }) {
  const paid = slots - slotsLeft;
  const shown = Math.min(slots, size === "lg" ? 60 : 20);
  const shownPaid = Math.min(paid, shown);
  const box = size === "lg" ? "h-5 w-5" : "h-3 w-3";
  return (
    <div>
      <div className="flex flex-wrap gap-[3px]" role="img" aria-label={`${paid} of ${slots} places paid`}>
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className={`${box} border border-ink ${i < shownPaid ? "bg-ink" : "bg-transparent"}`} />
        ))}
        {slots > shown && <span className="pl-1 text-xs leading-none text-ink-soft">+{slots - shown}</span>}
      </div>
      <p className={`mt-1.5 text-ink-soft ${size === "lg" ? "text-[15px]" : "text-[13px]"}`}>
        {paid} of {slots} paid
      </p>
    </div>
  );
}
