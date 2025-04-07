
import { BoxDimensions, Item, PackedItem, PackingResult, OptimizeOptions, Space, Orientation } from "./types";
import { getPossibleOrientations, getRotationText } from "./utils";
import { 
  checkCollisionPrecise, 
  calculatePlacementScore, 
  checkIfSpaceHasSupport 
} from "./placementScorer";
import { splitSpaceImproved, cleanupSpacesImproved } from "./spaceManager";

// Enhanced 3D bin packing algorithm with improved space utilization
export const packItems = (box: BoxDimensions, items: Item[], options?: OptimizeOptions): PackingResult => {
  // Set default options if not provided
  const packingOptions = options || { allowRotation: true, allowStacking: true };
  
  // Deep copy items to avoid mutating the original array
  const itemsToProcess = JSON.parse(JSON.stringify(items)) as Item[];
  
  // Apply global rotation and stacking settings if specified
  if (packingOptions) {
    itemsToProcess.forEach(item => {
      // Override individual rotation settings with global setting if specified
      if (packingOptions.allowRotation !== undefined) {
        item.allowRotation = packingOptions.allowRotation;
      }
      
      // Override individual stacking settings with global setting if specified
      if (packingOptions.allowStacking !== undefined) {
        item.maxStack = packingOptions.allowStacking;
      }
    });
  }
  
  const packedItems: PackedItem[] = [];
  const unpackedItems: Item[] = [];
  const packingInstructions: string[] = [];

  // Box dimensions
  const boxWidth = box.width;
  const boxHeight = box.height;
  const boxDepth = box.depth;
  const boxVolume = boxWidth * boxHeight * boxDepth;

  // Enhanced sorting strategy: Sort items by volume (largest first) with secondary criteria
  itemsToProcess.sort((a, b) => {
    const volumeA = a.width * a.height * a.depth;
    const volumeB = b.width * b.height * b.depth;
    
    // Primary sort by volume
    if (volumeB !== volumeA) {
      return volumeB - volumeA;
    }
    
    // Secondary sort by height to prioritize taller items first (helps with stability)
    if (b.height !== a.height) {
      return b.height - a.height;
    }
    
    // Third sort by the largest dimension
    const maxDimA = Math.max(a.width, a.depth);
    const maxDimB = Math.max(b.width, b.depth);
    
    return maxDimB - maxDimA;
  });

  // Initialize space with the box - starting from (0,0,0) which is the bottom-left-back corner
  const spaces: Space[] = [
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

      // Get possible orientations based on rotation preference
      const orientations = getPossibleOrientations(item);

      // Find the best space for this item
      let bestSpace = -1;
      let bestOrientation: Orientation | null = null;
      let bestScore = Infinity;
      let bestPosition: { x: number, y: number, z: number } | null = null;

      // For each space, try all orientations to find the best fit
      for (let s = 0; s < spaces.length; s++) {
        const space = spaces[s];

        // GRAVITY CONSTRAINT: Skip spaces that aren't on the floor or on top of another item
        // Only apply this constraint if stacking is not allowed for this item
        if (space.y > 0 && !item.maxStack) {
          // Skip spaces that aren't on the floor
          continue;
        } else if (space.y > 0) {
          // Check if this space is supported by an item below
          const hasSupport = checkIfSpaceHasSupport(space, packedItems, boxWidth, boxDepth);
          
          // Skip unsupported spaces - this prevents floating items
          if (!hasSupport) {
            continue;
          }
        }

        for (const orientation of orientations) {
          // Check if the item fits in this space with this orientation
          if (
            orientation.width <= space.width &&
            orientation.height <= space.height &&
            orientation.depth <= space.depth
          ) {
            // IMPROVED BOUNDARY CHECK: Ensure the item is fully within the box boundaries
            if (
              space.x + orientation.width <= boxWidth &&
              space.y + orientation.height <= boxHeight &&
              space.z + orientation.depth <= boxDepth
            ) {
              // Use a more precise collision detection
              const wouldCollide = checkCollisionPrecise(
                space.x, 
                space.y, 
                space.z, 
                orientation.width, 
                orientation.height, 
                orientation.depth, 
                packedItems
              );
              
              // Only consider this position if there's no collision
              if (!wouldCollide) {
                // Enhanced scoring system to minimize gaps and ensure better placement
                const score = calculatePlacementScore(space, orientation, boxWidth, boxHeight, boxDepth, packedItems);
                  
                if (score < bestScore) {
                  bestScore = score;
                  bestSpace = s;
                  bestOrientation = orientation;
                  bestPosition = {
                    x: space.x,
                    y: space.y,
                    z: space.z
                  };
                }
              }
            }
          }
        }
      }

      // If we found a space for this item
      if (bestSpace !== -1 && bestOrientation !== null && bestPosition !== null) {
        const space = spaces[bestSpace];
        
        // DOUBLE CHECK: Ensure the position is valid - fully inside the box
        if (
          bestPosition.x + bestOrientation.width <= boxWidth &&
          bestPosition.y + bestOrientation.height <= boxHeight &&
          bestPosition.z + bestOrientation.depth <= boxDepth &&
          bestPosition.x >= 0 && bestPosition.y >= 0 && bestPosition.z >= 0
        ) {
          // Calculate the center position for the item
          const itemX = bestPosition.x + (bestOrientation.width / 2);
          const itemY = bestPosition.y + (bestOrientation.height / 2);
          const itemZ = bestPosition.z + (bestOrientation.depth / 2);
          
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
          const instruction = `${itemCounter}. Place ${item.name} at position (${Math.round(bestPosition.x)}cm, ${Math.round(bestPosition.y)}cm, ${Math.round(bestPosition.z)}cm)${rotationText ? ` ${rotationText}` : ''}.`;
          packingInstructions.push(instruction);
          itemCounter++;
          
          packedItems.push(packedItem);
          totalVolume += itemVolume;
          packed = true;

          // Use the improved space splitting algorithm
          const newSpaces = splitSpaceImproved(
            space,
            bestPosition.x,
            bestPosition.y,
            bestPosition.z,
            bestOrientation.width,
            bestOrientation.height,
            bestOrientation.depth
          );
          
          // Remove the used space and add the new spaces
          spaces.splice(bestSpace, 1, ...newSpaces);
          
          // Enhanced space management - cleanup after each placement
          cleanupSpacesImproved(spaces);
        }
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
