import { motion } from 'motion/react';
import { ReactNode } from 'react';
import * as React from 'react';

interface PulseButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  onClick?: () => void;
  backgroundImage?: string;
}

export function PulseButton({ children, variant = 'primary', onClick, backgroundImage }: PulseButtonProps) {
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

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${style.bg} ${style.shadow} ${style.hoverShadow} ${style.text} ${style.size} ${style.border}
        rounded font-bold uppercase tracking-widest
        transition-all duration-300 relative overflow-hidden
        backdrop-blur-sm
      `}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
      animate={
        isHovered
          ? {
              x: [0, -2, 2, -2, 2, -1, 1, 0],
              y: [0, -1, 1, -1, 1, -2, 2, 0],
              boxShadow:
                variant === 'primary'
                  ? '0 0 50px rgba(220,38,38,0.7)'
                  : variant === 'secondary'
                  ? '0 0 40px rgba(220,38,38,0.4)'
                  : undefined,
            }
          : variant === 'primary'
          ? {
              boxShadow: [
                '0 0 30px rgba(220,38,38,0.5)',
                '0 0 50px rgba(220,38,38,0.7)',
                '0 0 30px rgba(220,38,38,0.5)',
              ],
            }
          : {}
      }
      transition={
        isHovered
          ? {
              x: {
                duration: 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              y: {
                duration: 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : variant === 'primary'
          ? {
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {}
      }
      whileTap={{ scale: 0.98 }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/70" />
      )}

      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/30 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      <span className="relative z-10 drop-shadow-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{children}</span>
    </motion.button>
  );
}
