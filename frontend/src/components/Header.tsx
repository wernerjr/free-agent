interface HeaderProps {
  title: string;
  leftControl?: React.ReactNode;
}

export function Header({ title, leftControl }: HeaderProps) {
  return (
    <div className="flex-none h-header bg-dracula-current border-b border-dracula-comment/20 px-4 flex items-center gap-4">
      {leftControl}
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <circle cx="16" cy="16" r="16" fill="#282A36"/>
          <path d="M8 12h16v12H8z" fill="#44475A"/>
          <path d="M12 16h2v2h-2z" fill="#BD93F9"/>
          <path d="M18 16h2v2h-2z" fill="#BD93F9"/>
          <path d="M10 20h12v2H10z" fill="#FF79C6"/>
          <path d="M16 6v4" stroke="#8BE9FD" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="4" r="2" fill="#8BE9FD"/>
        </svg>
        <h1 className="text-xl font-semibold text-dracula-purple">{title}</h1>
      </div>
    </div>
  );
} 