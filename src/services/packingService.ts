import { BoxDimensions, Item, PackedItem, PackingResult } from "@/types";

// Enhanced 3D bin packing algorithm
export const packItems = (box: BoxDimensions, items: Item[]): PackingResult => {
  // Deep copy items to avoid mutating the original array
  const itemsToProcess = JSON.parse(JSON.stringify(items)) as Item[];
  const packedItems: PackedItem[] = [];
  const unpackedItems: Item[] = [];

  // Box dimensions
  const boxWidth = box.width;
  const boxHeight = box.height;
  const boxDepth = box.depth;
  const boxVolume = boxWidth * boxHeight * boxDepth;

  // Sort items by volume (largest first) and then by the largest dimension
  itemsToProcess.sort((a, b) => {
    const volumeA = a.width * a.height * a.depth;
    const volumeB = b.width * a.height * b.depth;
    if (volumeB !== volumeA) {
      return volumeB - volumeA;
    }
    // If volumes are equal, sort by largest dimension
    const maxDimA = Math.max(a.width, a.height, a.depth);
    const maxDimB = Math.max(b.width, b.height, b.depth);
    return maxDimB - maxDimA;
  });

  // Initialize space with the box
  const spaces = [
    {
      x: 0,
      y: 0,
      z: 0,
      width: boxWidth,
      height: boxHeight,
      depth: boxDepth
    }
  ];

  let totalVolume = 0;

  // Process each item
  for (const item of itemsToProcess) {
    for (let i = 0; i < item.quantity; i++) {
      // Try to find a space for this item
      let packed = false;
      const itemVolume = item.width * item.height * item.depth;

      // Try different orientations of the item
      const orientations = getPossibleOrientations(item);

      // Find the best space for this item
      let bestSpace = -1;
      let bestOrientation = null;
      let bestScore = Infinity;

      // For each space, try all orientations to find the best fit
      for (let s = 0; s < spaces.length; s++) {
        const space = spaces[s];

        for (const orientation of orientations) {
          // Check if the item fits in this space with this orientation
          if (
            orientation.width <= space.width &&
            orientation.height <= space.height &&
            orientation.depth <= space.depth
          ) {
            // Calculate score for this placement (lower is better)
            // Try to minimize wasted space by placing items in corners
            const score = 
              (space.width - orientation.width) * 
              (space.height - orientation.height) * 
              (space.depth - orientation.depth);

            if (score < bestScore) {
              bestScore = score;
              bestSpace = s;
              bestOrientation = orientation;
            }
          }
        }
      }

      // If we found a space for this item
      if (bestSpace !== -1 && bestOrientation !== null) {
        const space = spaces[bestSpace];
        
        // Add the item to packed items
        const packedItem: PackedItem = {
          ...item,
          id: `${item.id}-${i}`,
          width: bestOrientation.width,
          height: bestOrientation.height,
          depth: bestOrientation.depth,
          position: [
            space.x + bestOrientation.width / 2,
            space.y + bestOrientation.height / 2,
            space.z + bestOrientation.depth / 2
          ],
          rotation: bestOrientation.rotation,
        };
        
        packedItems.push(packedItem);
        totalVolume += itemVolume;
        packed = true;

        // Split the space into new spaces
        const newSpaces = splitSpace(
          space,
          bestOrientation.width,
          bestOrientation.height,
          bestOrientation.depth
        );
        
        // Remove the used space and add the new spaces
        spaces.splice(bestSpace, 1, ...newSpaces);
        
        // Clean up spaces (merge overlapping spaces, remove contained spaces)
        cleanupSpaces(spaces);
      }

      // If we couldn't pack this item
      if (!packed) {
        unpackedItems.push({...item, quantity: 1});
      }
    }
  }

  const utilizationPercentage = (totalVolume / boxVolume) * 100;

  return {
    success: packedItems.length > 0,
    packedItems,
    unpackedItems,
    utilizationPercentage: Math.min(utilizationPercentage, 100)
  };
};

// Get all possible orientations of an item based on its stackability
const getPossibleOrientations = (item: Item) => {
  const orientations = [];
  
  // Consider the item's maximum stacking constraint
  // If maxStack is 1 or undefined, only allow the original orientation
  if (!item.maxStack || item.maxStack === 1) {
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
  
  // Other rotations
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

// Split a space after placing an item into it
const splitSpace = (space: any, itemWidth: number, itemHeight: number, itemDepth: number) => {
  const newSpaces = [];

  // Create right space
  if (space.width > itemWidth) {
    newSpaces.push({
      x: space.x + itemWidth,
      y: space.y,
      z: space.z,
      width: space.width - itemWidth,
      height: space.height,
      depth: space.depth
    });
  }

  // Create top space
  if (space.height > itemHeight) {
    newSpaces.push({
      x: space.x,
      y: space.y + itemHeight,
      z: space.z,
      width: itemWidth,
      height: space.height - itemHeight,
      depth: space.depth
    });
  }

  // Create front space
  if (space.depth > itemDepth) {
    newSpaces.push({
      x: space.x,
      y: space.y,
      z: space.z + itemDepth,
      width: itemWidth,
      height: itemHeight,
      depth: space.depth - itemDepth
    });
  }

  return newSpaces.length > 0 ? newSpaces : [{
    x: space.x,
    y: space.y,
    z: space.z,
    width: 0,
    height: 0,
    depth: 0
  }];
};

// Clean up spaces by removing contained spaces and merging overlapping spaces
const cleanupSpaces = (spaces: any[]) => {
  // Remove very small spaces
  for (let i = spaces.length - 1; i >= 0; i--) {
    const space = spaces[i];
    if (space.width < 1 || space.height < 1 || space.depth < 1) {
      spaces.splice(i, 1);
    }
  }

  // Remove contained spaces
  for (let i = spaces.length - 1; i >= 0; i--) {
    for (let j = 0; j < spaces.length; j++) {
      if (i !== j && isContained(spaces[i], spaces[j])) {
        spaces.splice(i, 1);
        break;
      }
    }
  }
};

// Check if space1 is contained within space2
const isContained = (space1: any, space2: any) => {
  return (
    space1.x >= space2.x &&
    space1.y >= space2.y &&
    space1.z >= space2.z &&
    space1.x + space1.width <= space2.x + space2.width &&
    space1.y + space1.height <= space2.y + space2.height &&
    space1.z + space1.depth <= space2.z + space2.depth
  );
};
