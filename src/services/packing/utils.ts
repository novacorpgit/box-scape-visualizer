
import { Item, PackedItem } from "./types";

// Check if two ranges overlap
export const rangesOverlap = (min1: number, max1: number, min2: number, max2: number): boolean => {
  return !(max1 <= min2 || min1 >= max2);
};

// Function to create human-readable rotation text
export const getRotationText = (rotation: [number, number, number]): string => {
  if (rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0) {
    return '';
  }
  
  const axes = [];
  if (rotation[0] !== 0) axes.push(`${rotation[0]}° around X-axis`);
  if (rotation[1] !== 0) axes.push(`${rotation[1]}° around Y-axis`);
  if (rotation[2] !== 0) axes.push(`${rotation[2]}° around Z-axis`);
  
  return `rotated ${axes.join(' and ')}`;
};

// NEW: Check if an item can be stacked based on maxStack property
export const canItemBeStacked = (item: Item): boolean => {
  // If maxStack is a boolean, use it directly
  if (typeof item.maxStack === 'boolean') {
    return item.maxStack;
  }
  // If maxStack is a number, it can be stacked if it's greater than 1
  else if (typeof item.maxStack === 'number') {
    return item.maxStack > 1;
  }
  // Default to true if undefined
  return true;
};

// Check if space1 is fully contained within space2
export const isFullyContained = (space1: any, space2: any): boolean => {
  // Add a small tolerance to avoid floating point precision issues
  const tolerance = 0.001;
  return (
    space1.x >= space2.x - tolerance &&
    space1.y >= space2.y - tolerance &&
    space1.z >= space2.z - tolerance &&
    space1.x + space1.width <= space2.x + space2.width + tolerance &&
    space1.y + space1.height <= space2.y + space2.height + tolerance &&
    space1.z + space1.depth <= space2.z + space2.depth + tolerance
  );
};

// Get all possible orientations of an item based on its rotation preference
export const getPossibleOrientations = (item: Item) => {
  const orientations = [];
  
  // Consider the item's rotation preference
  // If allowRotation is false, only allow the original orientation
  if (item.allowRotation === false) {
    orientations.push({
      width: item.width,
      height: item.height,
      depth: item.depth,
      rotation: [0, 0, 0] as [number, number, number]
    });
    return orientations;
  }

  // Basic orientation (no rotation)
  orientations.push({
    width: item.width,
    height: item.height,
    depth: item.depth,
    rotation: [0, 0, 0] as [number, number, number]
  });
  
  // Rotate around X axis (90 degrees)
  orientations.push({
    width: item.width,
    height: item.depth,
    depth: item.height,
    rotation: [90, 0, 0] as [number, number, number]
  });
  
  // Rotate around Y axis (90 degrees)
  orientations.push({
    width: item.depth,
    height: item.height,
    depth: item.width,
    rotation: [0, 90, 0] as [number, number, number]
  });
  
  // Rotate around Z axis (90 degrees)
  orientations.push({
    width: item.height,
    height: item.width,
    depth: item.depth,
    rotation: [0, 0, 90] as [number, number, number]
  });
  
  // Combined rotations for 6 possible orientations
  orientations.push({
    width: item.depth,
    height: item.width,
    depth: item.height,
    rotation: [90, 90, 0] as [number, number, number]
  });
  
  orientations.push({
    width: item.height,
    height: item.depth,
    depth: item.width,
    rotation: [90, 0, 90] as [number, number, number]
  });

  return orientations;
};
