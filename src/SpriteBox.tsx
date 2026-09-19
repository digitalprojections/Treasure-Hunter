import React from 'react';
import { SpriteBoxModule, resolveSpriteBoxAsset } from './utils/spritebox';
import { cn } from './utils/styles';

interface SpriteBoxProps {
  spriteBox: SpriteBoxModule;
  seed: string;
  elapsedMs?: number;
  level?: number;
  alt?: string;
  className?: string;
  imageClassName?: string;
  draggable?: boolean;
}

export const SpriteBox: React.FC<SpriteBoxProps> = ({
  spriteBox,
  seed,
  elapsedMs = 0,
  level = 1,
  alt,
  className,
  imageClassName,
  draggable = false,
}) => {
  const asset = resolveSpriteBoxAsset(spriteBox, seed, elapsedMs, level);

  return (
    <div className={cn('h-full w-full', className)}>
      <img
        src={asset.src}
        alt={alt ?? spriteBox.label}
        className={cn('h-full w-full object-contain', imageClassName)}
        draggable={draggable}
      />
    </div>
  );
};
