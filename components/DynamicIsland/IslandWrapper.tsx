'use client';

import { motion } from 'motion/react';
import { IslandWrapperProps } from './types';

export function IslandWrapper({ isExpanded, children, className = '' }: IslandWrapperProps) {
  // Position styles - relative to chat container
  const positionStyles = {
    zIndex: 1000,
  };

  // Dimension variants based on expansion state
  const dimensionVariants = {
    compact: { width: 320, height: 48 },
    expanded: { width: 384, height: 320 },
  };

  const borderRadiusVariants = {
    compact: { borderRadius: 24 },
    expanded: { borderRadius: 20 },
  };

  return (
    <motion.div
      style={positionStyles}
      className={`backdrop-blur-lg bg-black/75 border border-white/10 ${className}`}
      initial="compact"
      animate={isExpanded ? "expanded" : "compact"}
      variants={{
        compact: {
          ...dimensionVariants.compact,
          ...borderRadiusVariants.compact,
        },
        expanded: {
          ...dimensionVariants.expanded,
          ...borderRadiusVariants.expanded,
        },
      }}
      transition={{
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
} 