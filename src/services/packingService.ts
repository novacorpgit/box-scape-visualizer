import { BoxDimensions, Item, PackedItem, PackingResult } from "@/types";

// Enhanced 3D bin packing algorithm with improved space utilization
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

  // Enhanced sorting strategy: Sort items by volume (largest first) with secondary criteria
  itemsToProcess.sort((a, b) => {
    const volumeA = a.width * a.height * a.depth;
    const volumeB = b.width * b.height * b.depth;
    
    // Primary sort by volume
    if (volumeB !== volumeA) {
      return volumeB - volumeA;
    }
    
    // Secondary sort by the largest dimension to prioritize more "bulky" items
    const maxDimA = Math.max(a.width, a.height, a.depth);
    const maxDimB = Math.max(b.width, b.height, b.depth);
    
    // If largest dimensions differ, sort by that
    if (maxDimB !== maxDimA) {
      return maxDimB - maxDimA;
    }
    
    // Third, sort by height to place taller items first (helps with stability)
    return b.height - a.height;
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

      // Get possible orientations based on rotation preference
      const orientations = getPossibleOrientations(item);

      // Find the best space for this item
      let bestSpace = -1;
      let bestOrientation = null;
      let bestScore = Infinity;
      let bestPosition = null;

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
            // IMPROVED BOUNDARY CHECK: Ensure the item is fully within the box boundaries
            if (
              space.x + orientation.width <= boxWidth &&
              space.y + orientation.height <= boxHeight &&
              space.z + orientation.depth <= boxDepth
            ) {
              // FIX: Use a more precise collision detection with a smaller tolerance
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
                // Enhanced scoring system to minimize gaps
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
        
        // Calculate the actual position of the item in the box
        const itemX = bestPosition.x + (bestOrientation.width / 2);
        const itemY = bestPosition.y + (bestOrientation.height / 2);
        const itemZ = bestPosition.z + (bestOrientation.depth / 2);
        
        // FINAL VALIDATION: Double check that the item is fully within box boundaries
        if (
          itemX - bestOrientation.width/2 >= 0 && 
          itemX + bestOrientation.width/2 <= boxWidth &&
          itemY - bestOrientation.height/2 >= 0 && 
          itemY + bestOrientation.height/2 <= boxHeight &&
          itemZ - bestOrientation.depth/2 >= 0 && 
          itemZ + bestOrientation.depth/2 <= boxDepth
        ) {
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

          // Use the improved space splitting algorithm with bias towards larger spaces
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
          
          // Enhanced space management - more aggressive cleanup
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

// NEW: More precise collision detection with smaller tolerance
const checkCollisionPrecise = (
  x: number, 
  y: number, 
  z: number, 
  width: number, 
  height: number, 
  depth: number, 
  packedItems: PackedItem[]
): boolean => {
  // Calculate bounds of the new item
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  const z1 = z;
  const z2 = z + depth;
  
  // Very small tolerance to avoid floating point issues
  const tolerance = 0.001;
  
  // Check collision with each packed item
  for (const item of packedItems) {
    // Calculate bounds of the packed item from its center position
    const itemX1 = item.position[0] - item.width / 2;
    const itemX2 = item.position[0] + item.width / 2;
    const itemY1 = item.position[1] - item.height / 2;
    const itemY2 = item.position[1] + item.height / 2;
    const itemZ1 = item.position[2] - item.depth / 2;
    const itemZ2 = item.position[2] + item.depth / 2;
    
    // Check for overlap in all dimensions with reduced tolerance
    if (
      x1 < itemX2 - tolerance && x2 > itemX1 + tolerance &&
      y1 < itemY2 - tolerance && y2 > itemY1 + tolerance &&
      z1 < itemZ2 - tolerance && z2 > itemZ1 + tolerance
    ) {
      // Collision detected
      return true;
    }
  }
  
  // No collision found
  return false;
};

// Calculate score for a placement - lower is better
const calculatePlacementScore = (
  space: any, 
  orientation: any, 
  boxWidth: number, 
  boxHeight: number, 
  boxDepth: number,
  packedItems: PackedItem[]
) => {
  // Base score components
  let score = 0;
  
  // COMPONENT 1: Corner/Edge Placement Bonus
  // Heavily prioritize corner placements (3 walls)
  const isCorner = (
    (space.x === 0 || space.x + orientation.width === boxWidth) &&
    (space.y === 0 || space.y + orientation.height === boxHeight) &&
    (space.z === 0 || space.z + orientation.depth === boxDepth)
  );
  
  // Next prioritize edge placements (2 walls)
  const isEdge = (
    ((space.x === 0 || space.x + orientation.width === boxWidth) && (space.y === 0 || space.y + orientation.height === boxHeight)) ||
    ((space.x === 0 || space.x + orientation.width === boxWidth) && (space.z === 0 || space.z + orientation.depth === boxDepth)) ||
    ((space.y === 0 || space.y + orientation.height === boxHeight) && (space.z === 0 || space.z + orientation.depth === boxDepth))
  );
  
  // Finally prioritize wall placements (1 wall)
  const isWall = (
    space.x === 0 || space.x + orientation.width === boxWidth ||
    space.y === 0 || space.y + orientation.height === boxHeight ||
    space.z === 0 || space.z + orientation.depth === boxDepth
  );
  
  if (isCorner) {
    score -= 10000; // Major bonus for corner placements
  } else if (isEdge) {
    score -= 5000;  // Significant bonus for edge placements
  } else if (isWall) {
    score -= 2000;  // Moderate bonus for wall placements
  }
  
  // COMPONENT 2: Proximity to other items - reward tight packing
  // Check if this item would be adjacent to other packed items
  let touchingFacesCount = 0;
  let minDistance = Infinity;
  
  // Item coordinates
  const itemMinX = space.x;
  const itemMaxX = space.x + orientation.width;
  const itemMinY = space.y;
  const itemMaxY = space.y + orientation.height;
  const itemMinZ = space.z;
  const itemMaxZ = space.z + orientation.depth;
  
  for (const packedItem of packedItems) {
    // Calculate packed item boundaries
    const packedMinX = packedItem.position[0] - packedItem.width/2;
    const packedMaxX = packedItem.position[0] + packedItem.width/2;
    const packedMinY = packedItem.position[1] - packedItem.height/2;
    const packedMaxY = packedItem.position[1] + packedItem.height/2;
    const packedMinZ = packedItem.position[2] - packedItem.depth/2;
    const packedMaxZ = packedItem.position[2] + packedItem.depth/2;
    
    // Check for touching faces with smaller tolerance
    const touchTolerance = 0.01;
    
    // X-face touching
    if ((Math.abs(itemMinX - packedMaxX) < touchTolerance || Math.abs(itemMaxX - packedMinX) < touchTolerance) &&
        rangesOverlap(itemMinY, itemMaxY, packedMinY, packedMaxY) &&
        rangesOverlap(itemMinZ, itemMaxZ, packedMinZ, packedMaxZ)) {
      touchingFacesCount++;
    }
    
    // Y-face touching
    if ((Math.abs(itemMinY - packedMaxY) < touchTolerance || Math.abs(itemMaxY - packedMinY) < touchTolerance) &&
        rangesOverlap(itemMinX, itemMaxX, packedMinX, packedMaxX) &&
        rangesOverlap(itemMinZ, itemMaxZ, packedMinZ, packedMaxZ)) {
      touchingFacesCount++;
    }
    
    // Z-face touching
    if ((Math.abs(itemMinZ - packedMaxZ) < touchTolerance || Math.abs(itemMaxZ - packedMinZ) < touchTolerance) &&
        rangesOverlap(itemMinX, itemMaxX, packedMinX, packedMaxX) &&
        rangesOverlap(itemMinY, itemMaxY, packedMinY, packedMaxY)) {
      touchingFacesCount++;
    }
    
    // Compute minimum distance to packed item (for close but not touching items)
    const distance = Math.sqrt(
      Math.pow(Math.max(0, Math.min(Math.abs(itemMinX - packedMaxX), Math.abs(itemMaxX - packedMinX))), 2) +
      Math.pow(Math.max(0, Math.min(Math.abs(itemMinY - packedMaxY), Math.abs(itemMaxY - packedMinY))), 2) +
      Math.pow(Math.max(0, Math.min(Math.abs(itemMinZ - packedMaxZ), Math.abs(itemMaxZ - packedMinZ))), 2)
    );
    
    minDistance = Math.min(minDistance, distance);
  }
  
  // Bonus for touching other items - increased reward for touching
  score -= touchingFacesCount * 1500;
  
  // Bonus for being close to other items (if not touching)
  if (touchingFacesCount === 0 && minDistance !== Infinity) {
    score += minDistance * 100; // Penalty increases with distance
  }
  
  // COMPONENT 3: Fit quality - how well item fits in the space
  // Prefer spaces where the item fits snugly - modified to be less aggressive
  const widthFit = space.width - orientation.width;
  const heightFit = space.height - orientation.height;
  const depthFit = space.depth - orientation.depth;
  
  // Penalize wasted space, but less aggressively
  score += (widthFit * heightFit * depthFit) * 3;
  
  // Consider individual dimension fit
  score += (widthFit + heightFit + depthFit) * 30;
  
  // COMPONENT 4: Volumetric efficiency of the orientation
  // Prioritize orientations that use more of the space's volume
  const orientationVolume = orientation.width * orientation.height * orientation.depth;
  const spaceVolume = space.width * space.height * space.depth;
  const volumeEfficiency = orientationVolume / spaceVolume;
  score -= volumeEfficiency * 3000; // Bonus for efficient volume usage
  
  // COMPONENT 5: Position preference - favor items closer to origin for stability
  // Penalize distance from origin - floor is priority for stability
  score += space.y * 150; // Large penalty for height
  score += (space.x + space.z) * 15; // Smaller penalty for horizontal distance
  
  // COMPONENT 6: Wasted space risk - reduced penalty
  const wastedSpaceRisk = estimateWastedSpaceRisk(
    space.x, space.y, space.z,
    orientation.width, orientation.height, orientation.depth,
    boxWidth, boxHeight, boxDepth
  );
  score += wastedSpaceRisk * 200; // Reduced penalty weight
  
  return score;
};

// NEW IMPROVED: Estimate risk of creating wasted spaces (with reduced penalties)
const estimateWastedSpaceRisk = (
  x: number, y: number, z: number,
  width: number, height: number, depth: number,
  boxWidth: number, boxHeight: number, boxDepth: number
): number => {
  let risk = 0;
  
  // Increased gap tolerance - consider spaces up to 15cm as usable
  const smallGapThreshold = 15;
  
  // If placement creates a narrow gap against a wall, penalize it
  // X direction gaps - reduced penalties
  if (x > 0 && x < smallGapThreshold) {
    // Small gap between item and left wall
    risk += (smallGapThreshold - x) * 1;
  }
  if (x + width < boxWidth && boxWidth - (x + width) < smallGapThreshold) {
    // Small gap between item and right wall
    risk += (smallGapThreshold - (boxWidth - (x + width))) * 1;
  }
  
  // Y direction gaps (vertical) - reduced penalties
  if (y > 0 && y < smallGapThreshold) {
    // Small gap above the floor
    risk += (smallGapThreshold - y) * 1.5; // Still higher penalty for vertical gaps
  }
  if (y + height < boxHeight && boxHeight - (y + height) < smallGapThreshold) {
    // Small gap below ceiling
    risk += (smallGapThreshold - (boxHeight - (y + height))) * 1;
  }
  
  // Z direction gaps - reduced penalties
  if (z > 0 && z < smallGapThreshold) {
    // Small gap between item and back wall
    risk += (smallGapThreshold - z) * 1;
  }
  if (z + depth < boxDepth && boxDepth - (z + depth) < smallGapThreshold) {
    // Small gap between item and front wall
    risk += (smallGapThreshold - (boxDepth - (z + depth))) * 1;
  }
  
  return risk;
};

// Check if two ranges overlap
const rangesOverlap = (min1: number, max1: number, min2: number, max2: number) => {
  return !(max1 <= min2 || min1 >= max2);
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

// Get all possible orientations of an item based on its rotation preference
const getPossibleOrientations = (item: Item) => {
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

// IMPROVED: Space splitting algorithm - prioritize larger continuous spaces
const splitSpaceImproved = (
  space: any,
  itemX: number,
  itemY: number,
  itemZ: number,
  itemWidth: number,
  itemHeight: number,
  itemDepth: number
) => {
  // Calculate the six possible spaces after an item is placed
  const possibleSpaces = [];
  
  // Space to the right of the item (X+)
  if (space.x + space.width > itemX + itemWidth) {
    possibleSpaces.push({
      x: itemX + itemWidth,
      y: space.y,
      z: space.z,
      width: space.x + space.width - (itemX + itemWidth),
      height: space.height,
      depth: space.depth
    });
  }
  
  // Space to the left of the item (X-)
  if (itemX > space.x) {
    possibleSpaces.push({
      x: space.x,
      y: space.y,
      z: space.z,
      width: itemX - space.x,
      height: space.height,
      depth: space.depth
    });
  }
  
  // Space above the item (Y+)
  if (space.y + space.height > itemY + itemHeight) {
    possibleSpaces.push({
      x: space.x,
      y: itemY + itemHeight,
      z: space.z,
      width: space.width,
      height: space.y + space.height - (itemY + itemHeight),
      depth: space.depth
    });
  }
  
  // Space below the item (Y-)
  if (itemY > space.y) {
    possibleSpaces.push({
      x: space.x,
      y: space.y,
      z: space.z,
      width: space.width,
      height: itemY - space.y,
      depth: space.depth
    });
  }
  
  // Space in front of the item (Z+)
  if (space.z + space.depth > itemZ + itemDepth) {
    possibleSpaces.push({
      x: space.x,
      y: space.y,
      z: itemZ + itemDepth,
      width: space.width,
      height: space.height,
      depth: space.z + space.depth - (itemZ + itemDepth)
    });
  }
  
  // Space behind the item (Z-)
  if (itemZ > space.z) {
    possibleSpaces.push({
      x: space.x,
      y: space.y,
      z: space.z,
      width: space.width,
      height: space.height,
      depth: itemZ - space.z
    });
  }
  
  // Filter out spaces that are too small (smaller than 0.5 cm in any dimension)
  // More permissive minimum size to allow for more potential placements
  const viableSpaces = possibleSpaces.filter(s => 
    s.width >= 0.5 && s.height >= 0.5 && s.depth >= 0.5
  );
  
  // Sort by volume (largest first)
  viableSpaces.sort((a, b) => 
    (b.width * b.height * b.depth) - (a.width * a.height * a.depth)
  );
  
  return viableSpaces.length > 0 ? viableSpaces : [];
};

// IMPROVED: Space cleanup with better handling of small spaces
const cleanupSpacesImproved = (spaces: any[]) => {
  if (spaces.length <= 1) return;
  
  // First pass: Remove very tiny spaces
  for (let i = spaces.length - 1; i >= 0; i--) {
    const space = spaces[i];
    if (space.width < 0.5 || space.height < 0.5 || space.depth < 0.5 || 
        space.width * space.height * space.depth < 2) { // Smaller threshold (2 cubic cm)
      spaces.splice(i, 1);
    }
  }
  
  // Second pass: Remove completely contained spaces
  for (let i = spaces.length - 1; i >= 0; i--) {
    for (let j = 0; j < spaces.length; j++) {
      if (i !== j && isFullyContained(spaces[i], spaces[j])) {
        spaces.splice(i, 1);
        break;
      }
    }
  }
  
  // Third pass: Merge spaces that can be combined
  for (let i = 0; i < spaces.length; i++) {
    for (let j = i + 1; j < spaces.length; j++) {
      const mergedSpace = tryMergeSpaces(spaces[i], spaces[j]);
      if (mergedSpace) {
        spaces.splice(j, 1);
        spaces[i] = mergedSpace;
        j--;
      }
    }
  }
  
  // Don't limit spaces too aggressively - allow more potential placement options
  if (spaces.length > 35) {
    // Sort by volume (largest first) before trimming
    spaces.sort((a, b) => 
      (b.width * b.height * b.depth) - (a.width * a.height * a.depth)
    );
    spaces.length = 35;
  }
  
  // Final sort - prioritize spaces closer to the floor and origin
  spaces.sort((a, b) => {
    // Prioritize spaces closer to the floor (lower Y)
    if (a.y !== b.y) return a.y - b.y;
    
    // Then prioritize spaces closer to the origin
    return (a.x + a.z) - (b.x + b.z);
  });
};

// Check if space1 is fully contained within space2
const isFullyContained = (space1: any, space2: any): boolean => {
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

// Try to merge two spaces if they can form a larger continuous space
const tryMergeSpaces = (space1: any, space2: any): any => {
  // Add tolerance to avoid floating point precision issues
  const tolerance = 0.01;
  
  // Check if spaces can be merged along X axis
  if (Math.abs(space1.y - space2.y) < tolerance && 
      Math.abs(space1.z - space2.z) < tolerance &&
      Math.abs(space1.height - space2.height) < tolerance && 
      Math.abs(space1.depth - space2.depth) < tolerance) {
    // Space1 is to the left of Space2
    if (Math.abs((space1.x + space1.width) - space2.x) < tolerance) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width + space2.width,
        height: space1.height,
        depth: space1.depth
      };
    }
    // Space2 is to the left of Space1
    if (Math.abs((space2.x + space2.width) - space1.x) < tolerance) {
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
  
  // Check if spaces can be merged along Y axis
  if (Math.abs(space1.x - space2.x) < tolerance && 
      Math.abs(space1.z - space2.z) < tolerance &&
      Math.abs(space1.width - space2.width) < tolerance && 
      Math.abs(space1.depth - space2.depth) < tolerance) {
    // Space1 is below Space2
    if (Math.abs((space1.y + space1.height) - space2.y) < tolerance) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width,
        height: space1.height + space2.height,
        depth: space1.depth
      };
    }
    // Space2 is below Space1
    if (Math.abs((space2.y + space2.height) - space1.y) < tolerance) {
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
  
  // Check if spaces can be merged along Z axis
  if (Math.abs(space1.x - space2.x) < tolerance && 
      Math.abs(space1.y - space2.y) < tolerance &&
      Math.abs(space1.width - space2.width) < tolerance && 
      Math.abs(space1.height - space2.height) < tolerance) {
    // Space1 is behind Space2
    if (Math.abs((space1.z + space1.depth) - space2.z) < tolerance) {
      return {
        x: space1.x,
        y: space1.y,
        z: space1.z,
        width: space1.width,
        height: space1.height,
        depth: space1.depth + space2.depth
      };
    }
    // Space2 is behind Space1
    if (Math.abs((space2.z + space2.depth) - space1.z) < tolerance) {
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
  
  return null;
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
  
  // Calculate total volume needed with a more realistic buffer
  const totalItemVolume = itemsToProcess.reduce((total, item) => {
    return total + (item.width * item.height * item.depth * item.quantity);
  }, 0);
  
  // Calculate max item dimensions
  let maxItemWidth = 0;
  let maxItemHeight = 0;
  let maxItemDepth = 0;
  
  // Find the maximum dimensions, considering all possible orientations
  itemsToProcess.forEach(item => {
    if (item.allowRotation !== false) {
      // If the item can be rotated, consider all dimensions
      maxItemWidth = Math.max(maxItemWidth, item.width, item.height, item.depth);
      maxItemHeight = Math.max(maxItemHeight, item.width, item.height, item.depth);
      maxItemDepth = Math.max(maxItemDepth, item.width, item.height, item.depth);
    } else {
      // If the item can't be rotated, respect its orientation
      maxItemWidth = Math.max(maxItemWidth,
