
// Main exports from the packing service
export { packItems } from './packer';
export { findOptimalBoxSize, tryPackingWithDimensions } from './optimalBoxFinder';
export type { OptimizeOptions, BoxDimensions, Item, PackedItem, PackingResult } from './types';
