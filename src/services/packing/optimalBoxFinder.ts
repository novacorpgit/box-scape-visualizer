import { Item, PackingResult, OptimizeOptions, BoxDimensions } from "./types";
import { packItems } from "./packer";

// Function to find the optimal box size with improved algorithm
export const findOptimalBoxSize = (items: Item[], options?: OptimizeOptions): PackingResult => {
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
  
  // Calculate total volume needed with a more realistic buffer
  const totalItemsVolume = itemsToProcess.reduce((total, item) => {
    return total + (item.width * item.height * item.depth * item.quantity);
  }, 0);
  
  // Calculate max item dimensions
  let maxItemWidth = 0;
  let maxItemHeight = 0;
  let maxItemDepth = 0;
  
  // Find the maximum dimensions, considering all possible orientations
  itemsToProcess.forEach(item => {
    if ((options && options.allowRotation) || (item.allowRotation !== false && options?.allowRotation !== false)) {
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
  
  // Initial guess for box dimensions with buffer factor - using a larger buffer for optimization
  // When optimizing, we want to ensure ALL items fit, so we use a larger buffer
  const bufferFactor = 1.3; // Moderate buffer for first attempt
  
  // Start with a simple cuboid approach - using cubic root to approximate dimensions
  const cubeRoot = Math.cbrt(totalItemsVolume * bufferFactor);
  
  // Create an initial box slightly larger than the cube root estimate,
  // but respecting the maximum item dimensions
  let initialWidth = Math.max(cubeRoot, maxItemWidth);
  let initialHeight = Math.max(cubeRoot, maxItemHeight);
  let initialDepth = Math.max(cubeRoot, maxItemDepth);
  
  // Adjust the box to be more suitable for shipping (not too tall, wider base)
  // Prefer height to be the smallest dimension if possible
  const targetRatio = 0.7; // height:width ratio target for stability
  
  if (initialHeight > initialWidth * targetRatio && maxItemHeight <= initialWidth * targetRatio) {
    // If box is too tall and we can make it shorter, do so
    const excessHeight = initialHeight - (initialWidth * targetRatio);
    initialDepth += excessHeight * 0.7;
    initialWidth += excessHeight * 0.3;
    initialHeight = initialWidth * targetRatio;
  }
  
  // Create a mutable box dimensions object that we can update
  let currentBoxDimensions: BoxDimensions = {
    width: Math.ceil(initialWidth),
    height: Math.ceil(initialHeight),
    depth: Math.ceil(initialDepth)
  };
  
  // Try packing items into the initial box
  let packingResult = packItems(currentBoxDimensions, itemsToProcess, options);
  
  // Keep increasing box size until all items fit
  let attempts = 0;
  const maxAttempts = 15; // Increased max attempts to ensure all items fit
  
  while (packingResult.unpackedItems.length > 0 && attempts < maxAttempts) {
    attempts++;
    
    // Increase box dimensions by 10% each iteration
    const growthFactor = 1.1;
    currentBoxDimensions = {
      width: Math.ceil(currentBoxDimensions.width * growthFactor),
      height: Math.ceil(currentBoxDimensions.height * growthFactor),
      depth: Math.ceil(currentBoxDimensions.depth * growthFactor)
    };
    
    packingResult = packItems(currentBoxDimensions, itemsToProcess, options);
  }
  
  // If we still have unpacked items after multiple attempts, try a different approach
  if (packingResult.unpackedItems.length > 0) {
    // Calculate the total volume of all items (including unpacked ones)
    const totalVolume = itemsToProcess.reduce((sum, item) => 
      sum + (item.width * item.height * item.depth * item.quantity), 0);
    
    // Create a box with dimensions proportional to the largest items but big enough for all
    // Use a generous buffer factor of 2.5 to ensure everything fits
    const finalBuffer = 2.5;
    const finalCubeRoot = Math.cbrt(totalVolume * finalBuffer);
    
    const finalBox = {
      width: Math.max(Math.ceil(finalCubeRoot), maxItemWidth * 2),
      height: Math.max(Math.ceil(finalCubeRoot * 0.7), maxItemHeight * 2), // Slightly lower for stability
      depth: Math.max(Math.ceil(finalCubeRoot), maxItemDepth * 2)
    };
    
    // Try one final packing with a very large box
    packingResult = packItems(finalBox, itemsToProcess, options);
    
    // If we still have unpacked items, try one more time with an even larger box
    if (packingResult.unpackedItems.length > 0) {
      const extremeBox = {
        width: Math.ceil(finalBox.width * 1.5),
        height: Math.ceil(finalBox.height * 1.5),
        depth: Math.ceil(finalBox.depth * 1.5)
      };
      
      packingResult = packItems(extremeBox, itemsToProcess, options);
    }
  }
  
  return packingResult;
};

// Helper function to try packing with specific dimensions
export const tryPackingWithDimensions = (items: Item[], dimensions: BoxDimensions, options?: OptimizeOptions): PackingResult => {
  return packItems(dimensions, items, options);
};
