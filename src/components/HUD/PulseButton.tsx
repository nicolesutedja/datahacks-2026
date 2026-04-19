import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PulseButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  onClick?: () => void;
  backgroundImage?: string;
}

export function PulseButton({
  children,
  variant = 'primary',
  onClick,
  backgroundImage,
}: PulseButtonProps) {
  const styles = {
    primary: {
      bg: backgroundImage
        ? 'bg-cover bg-center'
        : 'bg-gradient-to-br from-red-600 via-red-700 to-red-900',
      shadow: 'shadow-[0_0_30px_rgba(220,38,38,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_50px_rgba(220,38,38,0.7)]',
      text: 'text-white',
      size: 'px-20 py-8 text-xl min-w-[280px]',
      border: 'border-2 border-red-500/30',
    },
    secondary: {
      bg: backgroundImage
        ? 'bg-cover bg-center'
        : 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black',
      shadow: 'shadow-[0_0_20px_rgba(220,38,38,0.25)]',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]',
      text: 'text-red-400',
      size: 'px-20 py-8 text-xl min-w-[280px]',
      border: 'border-2 border-red-900/40',
    },
    tertiary: {
      bg: 'bg-black/40 border border-red-950/30',
      shadow: '',
      hoverShadow: 'hover:border-red-800/50',
      text: 'text-red-300/60',
      size: 'px-8 py-3 text-sm',
      border: '',
    },
  };

  const style = styles[variant];

  return (
    <motion.button
      onClick={onClick}
      className={`
        ${style.bg} ${style.shadow} ${style.hoverShadow} ${style.text} ${style.size} ${style.border}
        rounded font-bold uppercase tracking-widest
        transition-all duration-300 relative overflow-hidden
        backdrop-blur-sm
      `}
      style={
        backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}
      }
      whileTap={{ scale: 0.98 }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/70" />
      )}

      <span className="relative z-10 drop-shadow-lg">
        {children}
      </span>
    </motion.button>
  );
}