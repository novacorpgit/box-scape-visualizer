
import { BoxDimensions, Item, PackedItem, PackingResult, OptimizeOptions } from "@/types";

// Internal types used by the packing algorithm
export interface Space {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export interface Orientation {
  width: number;
  height: number;
  depth: number;
  rotation: [number, number, number];
}

export type { BoxDimensions, Item, PackedItem, PackingResult, OptimizeOptions };
