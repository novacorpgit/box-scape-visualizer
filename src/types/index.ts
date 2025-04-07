export interface BoxDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Item {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  weight: number;
  maxStack: number | boolean; // Now can be a boolean flag or number
  color: string;
  allowRotation?: boolean; // Controls whether the item can be rotated in 3D space
}

export interface PackedItem extends Item {
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface PackingResult {
  success: boolean;
  packedItems: PackedItem[];
  unpackedItems: Item[];
  utilizationPercentage: number;
  packingInstructions: string[];
  boxDimensions: BoxDimensions;
}

export interface OptimizeOptions {
  allowRotation: boolean;
  allowStacking: boolean;
}
