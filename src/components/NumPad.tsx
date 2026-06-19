interface NumPadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  showMinus?: boolean;
}

export function NumPad({ onDigit, onBackspace, onSubmit, showMinus = false }: NumPadProps) {
  const btn = (label: string, action: () => void, cls = "") => (
    <button
      key={label}
      type="button"
      className={`numpad__key ${cls}`}
      onPointerDown={(e) => { e.preventDefault(); action(); }}
    >
      {label}
    </button>
  );

  return (
    <div className="numpad">
      <div className="numpad__grid">
        {["1","2","3","4","5","6","7","8","9"].map((d) => btn(d, () => onDigit(d)))}
        {showMinus ? btn("−", () => onDigit("-"), "numpad__key--minus") : <div />}
        {btn("0", () => onDigit("0"))}
        {btn("⌫", onBackspace, "numpad__key--back")}
      </div>
      <button
        type="button"
        className="numpad__enter btn btn--primary"
        onPointerDown={(e) => { e.preventDefault(); onSubmit(); }}
      >
        Enter ↵
      </button>
    </div>
  );
}
