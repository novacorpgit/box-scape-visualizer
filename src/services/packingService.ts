
// Re-export everything from the packing service
export { packItems, findOptimalBoxSize, tryPackingWithDimensions } from './packing';
export type { OptimizeOptions, BoxDimensions, Item, PackedItem, PackingResult } from './packing/types';
