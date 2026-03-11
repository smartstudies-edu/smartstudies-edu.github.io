import type { Game } from "@/data/games";
import { categoryEmojis } from "@/data/games";

interface GameCardProps {
  game: Game;
  onClick: () => void;
  featured?: boolean;
}

const GameCard = ({ game, onClick, featured }: GameCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center rounded-xl border bg-card/60 backdrop-blur-sm p-4 text-center transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.04] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 ${
        featured ? "border-primary/20 shadow-md shadow-primary/5" : "border-border/40"
      }`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-transparent to-primary/0 group-hover:from-primary/[0.08] group-hover:to-primary/[0.03] transition-all duration-500" />
      
      {/* Icon container */}
      <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mb-3 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
        <span className="text-2xl drop-shadow-sm">{categoryEmojis[game.category]}</span>
      </div>
      <h3 className="relative z-10 text-sm font-semibold text-foreground leading-tight line-clamp-2">
        {game.title}
      </h3>
      <span className="relative z-10 text-[10px] text-muted-foreground mt-1.5 font-medium tracking-wide uppercase">
        {game.category}
      </span>
      {featured && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/60 animate-pulse" />
      )}
    </button>
  );
};

export default GameCard;
