import { motion, useAnimation } from 'motion/react';
import { useState, useEffect } from 'react';

export default function Logo() {
  const controls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const brand = "uki";
  const suffix = "Angolano";
  
  const triggerJump = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Animate all letters sequentially
    await controls.start((i) => ({
      y: [0, -12, 0],
      transition: { 
        delay: i * 0.05, 
        duration: 0.5,
        ease: "easeInOut"
      }
    }));
    
    setIsAnimating(false);
  };

  useEffect(() => {
    // Initial jump after a short delay to get attention
    const initialDelay = setTimeout(triggerJump, 1000);
    
    // Set interval for jumping every 15 seconds so they don't forget the name
    const interval = setInterval(triggerJump, 15000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      onClick={triggerJump} 
      className="flex items-center cursor-pointer select-none group"
    >
      {/* Tilted B like the image */}
      <motion.div
        custom={0}
        animate={controls}
        className="bg-angola-red text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-red-900/20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"
      >
        B
      </motion.div>

      {/* "uki" part */}
      <div className="flex ml-1">
        {brand.split("").map((letter, i) => (
          <motion.span
            key={i}
            custom={i + 1}
            animate={controls}
            className="text-angola-black font-black text-3xl tracking-tighter"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* "Angolano" part */}
      <div className="flex ml-1">
        {suffix.split("").map((letter, i) => (
          <motion.span
            key={i + brand.length}
            custom={i + brand.length + 1}
            animate={controls}
            className="text-slate-400 font-bold text-xl tracking-tighter self-end pb-1"
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
