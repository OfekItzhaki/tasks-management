type FloatingActionButtonProps = {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
};

export default function FloatingActionButton({
  onClick,
  ariaLabel,
  disabled,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-glow hover:shadow-glow-lg hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </button>
  );
}

