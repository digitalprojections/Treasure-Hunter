import { EntityType, type TileVisualTone } from '../types';

export interface TileVisualPresentation {
  containerClassName: string;
  imageClassName: string;
}

interface TileAssetPresentationInput {
  visualTone?: TileVisualTone;
  entityType?: EntityType;
}

const resourceEntityTypes = new Set<EntityType>([
  EntityType.TREASURE,
  EntityType.RELIC,
]);

export function getTileAssetPresentation({
  visualTone,
  entityType,
}: TileAssetPresentationInput): TileVisualPresentation {
  if (visualTone === 'resource' || (entityType !== undefined && resourceEntityTypes.has(entityType))) {
    return {
      containerClassName: 'absolute inset-0 z-10 pointer-events-none',
      imageClassName: 'object-fill',
    };
  }

  return {
    containerClassName: 'absolute inset-0 z-10 p-[10%] pointer-events-none',
    imageClassName: 'object-contain drop-shadow-lg',
  };
}
