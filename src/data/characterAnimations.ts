import { discoverCharacterAnimations } from '../utils/characterAnimations';

// Vite discovers and bundles every frame at dev startup/build; no generated import list.
export const characterAnimations = discoverCharacterAnimations(import.meta.glob<string>(
  '../../assets/{heroes,enemies,wildlife}/*/*/*.{png,PNG,webp,WEBP,jpg,JPG,jpeg,JPEG}',
  { eager: true, query: '?url', import: 'default' },
));
