
import { BoxDimensions, Item, PackedItem, PackingResult } from "@/types";

// Enhanced 3D bin packing algorithm
export const packItems = (box: BoxDimensions, items: Item[]): PackingResult => {
  // Deep copy items to avoid mutating the original array
  const itemsToProcess = JSON.parse(JSON.stringify(items)) as Item[];
  const packedItems: PackedItem[] = [];
  const unpackedItems: Item[] = [];
  const packingInstructions: string[] = [];

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

  // Initialize space with the box - starting from (0,0,0) which is the bottom-left-back corner
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
  let itemCounter = 1;

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
            // Additional check to ensure the item is fully within the box boundaries
            if (
              space.x + orientation.width <= boxWidth &&
              space.y + orientation.height <= boxHeight &&
              space.z + orientation.depth <= boxDepth
            ) {
              // Calculate score for this placement (lower is better)
              // Modified scoring to minimize gaps
              const score = 
                // Prioritize placing items at the corners and edges
                Math.min(
                  space.x * (boxWidth - space.x - orientation.width),
                  space.y * (boxHeight - space.y - orientation.height),
                  space.z * (boxDepth - space.z - orientation.depth)
                ) +
                // Prioritize placing items in corners (lower is better)
                (space.x + space.y + space.z) * 10 +
                // Prioritize placing items flat against other items or walls
                (Math.abs(space.x) < 0.001 || Math.abs(space.x + orientation.width - boxWidth) < 0.001 ? -1000 : 0) +
                (Math.abs(space.y) < 0.001 || Math.abs(space.y + orientation.height - boxHeight) < 0.001 ? -1000 : 0) +
                (Math.abs(space.z) < 0.001 || Math.abs(space.z + orientation.depth - boxDepth) < 0.001 ? -1000 : 0);

              if (score < bestScore) {
                bestScore = score;
                bestSpace = s;
                bestOrientation = orientation;
              }
            }
          }
        }
      }

      // If we found a space for this item
      if (bestSpace !== -1 && bestOrientation !== null) {
        const space = spaces[bestSpace];
        
        // Calculate the actual position of the item in the box
        // These coordinates are from the center of the item
        const itemX = space.x + (bestOrientation.width / 2);
        const itemY = space.y + (bestOrientation.height / 2);
        const itemZ = space.z + (bestOrientation.depth / 2);
        
        // Add the item to packed items
        const packedItem: PackedItem = {
          ...item,
          id: `${item.id}-${i}`,
          width: bestOrientation.width,
          height: bestOrientation.height,
          depth: bestOrientation.depth,
          position: [itemX, itemY, itemZ],
          rotation: bestOrientation.rotation,
        };
        
        // Create packing instruction for this item
        const rotationText = getRotationText(bestOrientation.rotation);
        const instruction = `${itemCounter}. Place ${item.name} at position (${Math.round(space.x)}cm, ${Math.round(space.y)}cm, ${Math.round(space.z)}cm)${rotationText ? ` ${rotationText}` : ''}.`;
        packingInstructions.push(instruction);
        itemCounter++;
        
        packedItems.push(packedItem);
        totalVolume += itemVolume;
        packed = true;

        // Split the space into new spaces - improved space splitting algorithm
        const newSpaces = splitSpaceImproved(
          space,
          bestOrientation.width,
          bestOrientation.height,
          bestOrientation.depth
        );
        
        // Remove the used space and add the new spaces
        spaces.splice(bestSpace, 1, ...newSpaces);
        
        // Improved space cleanup to reduce fragmentation
        cleanupSpacesAdvanced(spaces);
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
    utilizationPercentage: Math.min(utilizationPercentage, 100),
    packingInstructions,
    boxDimensions: box
  };
};

// New function to find the optimal box size with improved algorithm
export const findOptimalBoxSize = (items: Item[]): PackingResult => {
  if (!items || items.length === 0) {
    return {
      success: false,
      packedItems: [],
      unpackedItems: [],
      utilizationPercentage: 0,
      packingInstructions: [],
      boxDimensions: { width: 0, height: 0, depth: 0 }
    };
  }

  // Make a copy of items for processing
  const itemsToProcess = JSON.parse(JSON.stringify(items)) as Item[];
  
  // Calculate total volume needed
  const totalItemVolume = itemsToProcess.reduce((total, item) => {
    return total + (item.width * item.height * item.depth * item.quantity);
  }, 0);
  
  // Calculate max item dimensions
  let maxItemWidth = 0;
  let maxItemHeight = 0;
  let maxItemDepth = 0;
  
  // Find the maximum dimensions, considering all possible orientations
  itemsToProcess.forEach(item => {
    if (!item.maxStack || item.maxStack > 1) {
      // If the item can be rotated, consider all dimensions
      maxItemWidth = Math.max(maxItemWidth, item.width, item.height, item.depth);
      maxItemHeight = Math.max(maxItemHeight, item.width, item.height, item.depth);
      maxItemDepth = Math.max(maxItemDepth, item.width, item.height, item.depth);
    } else {
      // If the item can't be rotated, respect its orientation
      maxItemWidth = Math.max(maxItemWidth, item.width);
      maxItemHeight = Math.max(maxItemHeight, item.height);
      maxItemDepth = Math.max(maxItemDepth, item.depth);
    }
  });
  
  // Buffer factor (reduced from 1.1 to 1.05 for tighter packing)
  const bufferFactor = 1.05;
  const targetVolume = totalItemVolume * bufferFactor;
  
  // Calculate initial dimensions based on volume cube root, but respect aspect ratios
  const cubeRoot = Math.pow(targetVolume, 1/3);
  
  // Start with dimensions that maintain a reasonable aspect ratio
  let initialBox: BoxDimensions = {
    width: Math.max(maxItemWidth, Math.ceil(cubeRoot)),
    height: Math.max(maxItemHeight, Math.ceil(cubeRoot)),
    depth: Math.max(maxItemDepth, Math.ceil(cubeRoot))
  };
  
  // Binary search approach to find optimal dimensions
  let bestResult: PackingResult | null = null;
  let iterations = 15; // Increased iterations for better results
  
  // Multi-step optimization: first find a box that fits all items
  // First pass: increase size until all items fit
  let allItemsFit = false;
  let growthFactor = 1.1;
  let currentBox = { ...initialBox };
  
  while (!allItemsFit && iterations > 0) {
    const result = packItems(currentBox, itemsToProcess);
    
    if (result.unpackedItems.length === 0) {
      // All items fit, save this result
      bestResult = result;
      allItemsFit = true;
    } else {
      // Items don't fit, increase box size
      currentBox = {
        width: Math.ceil(currentBox.width * growthFactor),
        height: Math.ceil(currentBox.height * growthFactor),
        depth: Math.ceil(currentBox.depth * growthFactor)
      };
    }
    
    iterations--;
  }
  
  // If we found a box that fits all items, try to optimize its dimensions
  if (bestResult) {
    // Second pass: try different aspect ratios to minimize volume
    const baseVolume = bestResult.boxDimensions.width * bestResult.boxDimensions.height * bestResult.boxDimensions.depth;
    
    // Try different aspect ratios
    const aspectVariations = [
      // Try to make box more cubic
      { w: 0.95, h: 1.0, d: 1.05 },
      { w: 1.05, h: 0.95, d: 1.0 },
      { w: 1.0, h: 1.05, d: 0.95 },
      // Try different aspect ratios
      { w: 0.9, h: 1.1, d: 1.0 },
      { w: 1.1, h: 0.9, d: 1.0 },
      { w: 1.0, h: 0.9, d: 1.1 },
      { w: 1.0, h: 1.1, d: 0.9 }
    ];
    
    for (const variation of aspectVariations) {
      const testBox: BoxDimensions = {
        width: Math.max(maxItemWidth, Math.ceil(bestResult.boxDimensions.width * variation.w)),
        height: Math.max(maxItemHeight, Math.ceil(bestResult.boxDimensions.height * variation.h)),
        depth: Math.max(maxItemDepth, Math.ceil(bestResult.boxDimensions.depth * variation.d))
      };
      
      const testVolume = testBox.width * testBox.height * testBox.depth;
      
      // Only test if the new volume is less than or equal to the current best
      if (testVolume <= baseVolume * 1.02) { // Allow a little flexibility (2%)
        const result = packItems(testBox, itemsToProcess);
        
        if (result.unpackedItems.length === 0 && 
            (result.utilizationPercentage > bestResult.utilizationPercentage || 
             testVolume < baseVolume)) {
          // Better utilization or smaller volume, update best result
          bestResult = result;
        }
      }
    }
    
    // Third pass: try to shrink the box slightly in each dimension
    const shrinkFactors = [0.98, 0.96, 0.94, 0.92, 0.90];
    
    for (const factor of shrinkFactors) {
      const testBox: BoxDimensions = {
        width: Math.max(maxItemWidth, Math.floor(bestResult.boxDimensions.width * factor)),
        height: Math.max(maxItemHeight, Math.floor(bestResult.boxDimensions.height * factor)),
        depth: Math.max(maxItemDepth, Math.floor(bestResult.boxDimensions.depth * factor))
      };
      
      const result = packItems(testBox, itemsToProcess);
      
      if (result.unpackedItems.length === 0) {
        // All items still fit in the smaller box
        bestResult = result;
      } else {
        // Items don't fit anymore, stop shrinking
        break;
      }
    }
    
    return bestResult;
  }
  
  // If we couldn't find a solution that fits all items, return our best attempt
  return packItems(currentBox, itemsToProcess);
};

// Function to create human-readable rotation text
const getRotationText = (rotation: [number, number, number]): string => {
  if (rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0) {
    return '';
  }
  
  const axes = [];
  if (rotation[0] !== 0) axes.push(`${rotation[0]}° around X-axis`);
  if (rotation[1] !== 0) axes.push(`${rotation[1]}° around Y-axis`);
  if (rotation[2] !== 0) axes.push(`${rotation[2]}° around Z-axis`);
  
  return `rotated ${axes.join(' and ')}`;
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

// Improved space splitting algorithm to reduce fragmentation
const splitSpaceImproved = (space: any, itemWidth: number, itemHeight: number, itemDepth: number) => {
  // Coordinates of the placed item
  const itemRight = space.x + itemWidth;
  const itemTop = space.y + itemHeight;
  const itemFront = space.z + itemDepth;
  
  // Remaining space dimensions
  const remainingWidth = space.width - itemWidth;
  const remainingHeight = space.height - itemHeight;
  const remainingDepth = space.depth - itemDepth;
  
  // Calculate which split would create the largest continuous volume
  const rightVolume = remainingWidth * space.height * space.depth;
  const topVolume = itemWidth * remainingHeight * space.depth;
  const frontVolume = itemWidth * itemHeight * remainingDepth;
  
  const newSpaces = [];
  
  // Split based on largest remaining volume - prioritize larger spaces
  if (rightVolume >= topVolume && rightVolume >= frontVolume && remainingWidth > 0) {
    // Split to the right (X direction)
    newSpaces.push({
      x: itemRight,
      y: space.y,
      z: space.z,
      width: remainingWidth,
      height: space.height,
      depth: space.depth
    });
    
    // Then check if we should split top or front next
    if (topVolume >= frontVolume && remainingHeight > 0) {
      newSpaces.push({
        x: space.x,
        y: itemTop,
        z: space.z,
        width: itemWidth,
        height: remainingHeight,
        depth: space.depth
      });
      
      if (remainingDepth > 0) {
        newSpaces.push({
          x: space.x,
          y: space.y,
          z: itemFront,
          width: itemWidth,
          height: itemHeight,
          depth: remainingDepth
        });
      }
    } else if (remainingDepth > 0) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: itemFront,
        width: itemWidth,
        height: itemHeight,
        depth: remainingDepth
      });
      
      if (remainingHeight > 0) {
        newSpaces.push({
          x: space.x,
          y: itemTop,
          z: space.z,
          width: itemWidth,
          height: remainingHeight,
          depth: itemDepth
        });
      }
    }
  } else if (topVolume >= frontVolume && remainingHeight > 0) {
    // Split to the top (Y direction)
    newSpaces.push({
      x: space.x,
      y: itemTop,
      z: space.z,
      width: itemWidth,
      height: remainingHeight,
      depth: space.depth
    });
    
    // Then check if we should split right or front next
    if (rightVolume >= frontVolume && remainingWidth > 0) {
      newSpaces.push({
        x: itemRight,
        y: space.y,
        z: space.z,
        width: remainingWidth,
        height: itemHeight,
        depth: space.depth
      });
      
      if (remainingDepth > 0) {
        newSpaces.push({
          x: space.x,
          y: space.y,
          z: itemFront,
          width: itemWidth,
          height: itemHeight,
          depth: remainingDepth
        });
      }
    } else if (remainingDepth > 0) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: itemFront,
        width: itemWidth,
        height: itemHeight,
        depth: remainingDepth
      });
      
      if (remainingWidth > 0) {
        newSpaces.push({
          x: itemRight,
          y: space.y,
          z: space.z,
          width: remainingWidth,
          height: itemHeight,
          depth: itemDepth
        });
      }
    }
  } else if (remainingDepth > 0) {
    // Split to the front (Z direction)
    newSpaces.push({
      x: space.x,
      y: space.y,
      z: itemFront,
      width: itemWidth,
      height: itemHeight,
      depth: remainingDepth
    });
    
    // Then check if we should split right or top next
    if (rightVolume >= topVolume && remainingWidth > 0) {
      newSpaces.push({
        x: itemRight,
        y: space.y,
        z: space.z,
        width: remainingWidth,
        height: itemHeight,
        depth: itemDepth
      });
      
      if (remainingHeight > 0) {
        newSpaces.push({
          x: space.x,
          y: itemTop,
          z: space.z,
          width: itemWidth,
          height: remainingHeight,
          depth: itemDepth
        });
      }
    } else if (remainingHeight > 0) {
      newSpaces.push({
        x: space.x,
        y: itemTop,
        z: space.z,
        width: itemWidth,
        height: remainingHeight,
        depth: itemDepth
      });
      
      if (remainingWidth > 0) {
        newSpaces.push({
          x: itemRight,
          y: space.y,
          z: space.z,
          width: remainingWidth,
          height: itemHeight,
          depth: itemDepth
        });
      }
    }
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

// Enhanced space cleanup to reduce fragmentation
const cleanupSpacesAdvanced = (spaces: any[]) => {
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
  
  // Merge overlapping spaces when possible
  for (let i = 0; i < spaces.length; i++) {
    for (let j = i + 1; j < spaces.length; j++) {
      const mergedSpace = tryMergeSpaces(spaces[i], spaces[j]);
      if (mergedSpace) {
        // Replace the two spaces with the merged one
        spaces.splice(j, 1);
        spaces[i] = mergedSpace;
        // Restart the merging process since we have a new space
        i = -1;
        break;
      }
    }
  }
  
  // Sort spaces by position (bottom-left-back first) to improve placement
  spaces.sort((a, b) => {
    // Prioritize spaces at the bottom
    if (a.y !== b.y) return a.y - b.y;
    // Then spaces at the back
    if (a.z !== b.z) return a.z - b.z;
    // Then spaces at the left
    return a.x - b.x;
  });
};

// Try to merge two spaces if they can form a larger continuous space
const tryMergeSpaces = (space1: any, space2: any) => {
  // Check if the spaces can be merged along the X axis
  if (space1.y === space2.y && space1.z === space2.z && 
      space1.height === space2.height && space1.depth === space2.depth) {
    if (space1.x + space1.width === space2.x) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width + space2.width,
        height: space1.height,
        depth: space1.depth
      };
    }
    if (space2.x + space2.width === space1.x) {
      return {
        x: space2.x,
        y: space1.y,
        z: space1.z,
        width: space1.width + space2.width,
        height: space1.height,
        depth: space1.depth
      };
    }
  }
  
  // Check if the spaces can be merged along the Y axis
  if (space1.x === space2.x && space1.z === space2.z && 
      space1.width === space2.width && space1.depth === space2.depth) {
    if (space1.y + space1.height === space2.y) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width,
        height: space1.height + space2.height,
        depth: space1.depth
      };
    }
    if (space2.y + space2.height === space1.y) {
      return {
        x: space1.x,
        y: space2.y,
        z: space1.z,
        width: space1.width,
        height: space1.height + space2.height,
        depth: space1.depth
      };
    }
  }
  
  // Check if the spaces can be merged along the Z axis
  if (space1.x === space2.x && space1.y === space2.y && 
      space1.width === space2.width && space1.height === space2.height) {
    if (space1.z + space1.depth === space2.z) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width,
        height: space1.height,
        depth: space1.depth + space2.depth
      };
    }
    if (space2.z + space2.depth === space1.z) {
      return {
        x: space1.x,
        y: space1.y,
        z: space2.z,
        width: space1.width,
        height: space1.height,
        depth: space1.depth + space2.depth
      };
    }
  }
  
  // Can't merge
  return null;
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
