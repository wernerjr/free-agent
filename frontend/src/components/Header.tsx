interface HeaderProps {
  title: string;
  leftControl?: React.ReactNode;
}

export function Header({ title, leftControl }: HeaderProps) {
  return (
    <div className="flex-none h-header bg-dracula-current border-b border-dracula-comment/20 px-4 flex items-center gap-4">
      {leftControl}
      <h1 className="text-xl font-semibold text-dracula-purple">{title}</h1>
    </div>
  );
} 