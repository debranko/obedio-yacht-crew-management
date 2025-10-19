interface ObedioLogoProps {
  variant?: "horizontal" | "stacked";
  className?: string;
}

export function ObedioLogo({ variant = "horizontal", className = "" }: ObedioLogoProps) {
  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="flex flex-col items-center" style={{ 
          fontFamily: 'Didot, "Bodoni MT", "Book Antiqua", Georgia, serif',
          letterSpacing: '0.15em',
          lineHeight: 1.8
        }}>
          <span className="text-foreground">O B E D I O</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ 
      fontFamily: 'Didot, "Bodoni MT", "Book Antiqua", Georgia, serif',
      letterSpacing: '0.15em'
    }}>
      <span className="text-foreground">O B E D I O</span>
    </div>
  );
}
