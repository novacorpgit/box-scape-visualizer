
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
            // This prevents items from extending outside the box
            if (
              space.x + orientation.width <= boxWidth &&
              space.y + orientation.height <= boxHeight &&
              space.z + orientation.depth <= boxDepth
            ) {
              // Check for collisions with already packed items
              const wouldCollide = checkCollision(
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
                // Lower score means better placement
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
        // These coordinates are from the center of the item
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
        
        // Perform a final collision check before adding the item
        const hasCollision = checkCollision(
          bestPosition.x, 
          bestPosition.y, 
          bestPosition.z, 
          bestOrientation.width, 
          bestOrientation.height, 
          bestOrientation.depth, 
          packedItems
        );
        
        // Only add the item if there's no collision
        if (!hasCollision) {
          // Create packing instruction for this item
          const rotationText = getRotationText(bestOrientation.rotation);
          const instruction = `${itemCounter}. Place ${item.name} at position (${Math.round(bestPosition.x)}cm, ${Math.round(bestPosition.y)}cm, ${Math.round(bestPosition.z)}cm)${rotationText ? ` ${rotationText}` : ''}.`;
          packingInstructions.push(instruction);
          itemCounter++;
          
          packedItems.push(packedItem);
          totalVolume += itemVolume;
          packed = true;

          // Use the improved space splitting algorithm
          const newSpaces = splitSpaceExhaustive(
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
          cleanupSpacesComplete(spaces);
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

// NEW FUNCTION: Check for collisions between items
// Returns true if there is a collision
const checkCollision = (
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
  
  // Check collision with each packed item
  for (const item of packedItems) {
    // Calculate bounds of the packed item
    // Adjust the position (which is the center) to get the corner
    const itemX1 = item.position[0] - item.width / 2;
    const itemX2 = item.position[0] + item.width / 2;
    const itemY1 = item.position[1] - item.height / 2;
    const itemY2 = item.position[1] + item.height / 2;
    const itemZ1 = item.position[2] - item.depth / 2;
    const itemZ2 = item.position[2] + item.depth / 2;
    
    // Check for overlap in all dimensions
    // Add a small buffer (0.1) to avoid floating point precision issues
    if (
      x1 < itemX2 + 0.1 && x2 > itemX1 - 0.1 &&
      y1 < itemY2 + 0.1 && y2 > itemY1 - 0.1 &&
      z1 < itemZ2 + 0.1 && z2 > itemZ1 - 0.1
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
    
    // Check for touching faces (approximate, as we're dealing with center positions)
    // X-face touching
    if ((Math.abs(itemMinX - packedMaxX) < 0.01 || Math.abs(itemMaxX - packedMinX) < 0.01) &&
        rangesOverlap(itemMinY, itemMaxY, packedMinY, packedMaxY) &&
        rangesOverlap(itemMinZ, itemMaxZ, packedMinZ, packedMaxZ)) {
      touchingFacesCount++;
    }
    
    // Y-face touching
    if ((Math.abs(itemMinY - packedMaxY) < 0.01 || Math.abs(itemMaxY - packedMinY) < 0.01) &&
        rangesOverlap(itemMinX, itemMaxX, packedMinX, packedMaxX) &&
        rangesOverlap(itemMinZ, itemMaxZ, packedMinZ, packedMaxZ)) {
      touchingFacesCount++;
    }
    
    // Z-face touching
    if ((Math.abs(itemMinZ - packedMaxZ) < 0.01 || Math.abs(itemMaxZ - packedMinZ) < 0.01) &&
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
  
  // Bonus for touching other items
  score -= touchingFacesCount * 1000;
  
  // Bonus for being close to other items (if not touching)
  if (touchingFacesCount === 0 && minDistance !== Infinity) {
    score += minDistance * 100; // Penalty increases with distance
  }
  
  // COMPONENT 3: Fit quality - how well item fits in the space
  // Prefer spaces where the item fits snugly
  const widthFit = space.width - orientation.width;
  const heightFit = space.height - orientation.height;
  const depthFit = space.depth - orientation.depth;
  
  // Heavily penalize wasted space
  score += (widthFit * heightFit * depthFit) * 5;
  
  // Also consider individual dimension fit
  score += (widthFit + heightFit + depthFit) * 50;
  
  // COMPONENT 4: Volumetric efficiency of the orientation
  // Prioritize orientations that use more of the space's volume
  const orientationVolume = orientation.width * orientation.height * orientation.depth;
  const spaceVolume = space.width * space.height * space.depth;
  const volumeEfficiency = orientationVolume / spaceVolume;
  score -= volumeEfficiency * 3000; // Bonus for efficient volume usage
  
  // COMPONENT 5: Position preference - favor items closer to origin for stability
  // Penalize distance from origin - floor is priority for stability
  score += space.y * 200; // Large penalty for height
  score += (space.x + space.z) * 20; // Smaller penalty for horizontal distance
  
  // COMPONENT 6: NEW - Prefer positions that won't cause future overlaps
  // This helps avoid creating small unusable spaces
  const wastedSpaceRisk = estimateWastedSpaceRisk(
    space.x, space.y, space.z,
    orientation.width, orientation.height, orientation.depth,
    boxWidth, boxHeight, boxDepth
  );
  score += wastedSpaceRisk * 300;
  
  return score;
};

// NEW FUNCTION: Estimate risk of creating wasted spaces
const estimateWastedSpaceRisk = (
  x: number, y: number, z: number,
  width: number, height: number, depth: number,
  boxWidth: number, boxHeight: number, boxDepth: number
): number => {
  let risk = 0;
  
  // If placement creates a narrow gap against a wall, penalize it
  // X direction gaps
  if (x > 0 && x < 10) {
    // Small gap between item and left wall
    risk += (10 - x) * 2;
  }
  if (x + width < boxWidth && boxWidth - (x + width) < 10) {
    // Small gap between item and right wall
    risk += (10 - (boxWidth - (x + width))) * 2;
  }
  
  // Y direction gaps (vertical)
  if (y > 0 && y < 10) {
    // Small gap above the floor
    risk += (10 - y) * 3; // Higher penalty for vertical gaps
  }
  if (y + height < boxHeight && boxHeight - (y + height) < 10) {
    // Small gap below ceiling
    risk += (10 - (boxHeight - (y + height))) * 2;
  }
  
  // Z direction gaps
  if (z > 0 && z < 10) {
    // Small gap between item and back wall
    risk += (10 - z) * 2;
  }
  if (z + depth < boxDepth && boxDepth - (z + depth) < 10) {
    // Small gap between item and front wall
    risk += (10 - (boxDepth - (z + depth))) * 2;
  }
  
  return risk;
};

// Check if two ranges overlap
const rangesOverlap = (min1: number, max1: number, min2: number, max2: number) => {
  return !(max1 < min2 || min1 > max2);
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

// Completely redesigned space splitting algorithm - create 6 possible split spaces and choose the best ones
const splitSpaceExhaustive = (
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
  
  // Filter out spaces that are too small (smaller than 1 cm in any dimension)
  const viableSpaces = possibleSpaces.filter(s => 
    s.width >= 1 && s.height >= 1 && s.depth >= 1
  );
  
  // Sort by volume (largest first)
  viableSpaces.sort((a, b) => 
    (b.width * b.height * b.depth) - (a.width * a.height * a.depth)
  );
  
  return viableSpaces.length > 0 ? viableSpaces : [];
};

// Enhanced space cleanup with complete check for space redundancy
const cleanupSpacesComplete = (spaces: any[]) => {
  if (spaces.length <= 1) return;
  
  // First pass: Remove tiny spaces
  for (let i = spaces.length - 1; i >= 0; i--) {
    const space = spaces[i];
    if (space.width < 1 || space.height < 1 || space.depth < 1 || 
        space.width * space.height * space.depth < 5) { // Ignore very small spaces (less than 5 cubic cm)
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
  
  // Third pass: Remove spaces that are contained within multiple other spaces combined
  for (let i = spaces.length - 1; i >= 0; i--) {
    // Skip if this space was already removed
    if (!spaces[i]) continue;
    
    const targetSpace = spaces[i];
    
    // Check if this space is fully covered by a combination of other spaces
    if (isSpaceCoveredByCombination(targetSpace, spaces, i)) {
      spaces.splice(i, 1);
    }
  }
  
  // Fourth pass: Merge spaces that can be combined
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
  
  // Limit the number of spaces to prevent excessive fragmentation
  if (spaces.length > 25) {
    // Sort by volume (largest first) before trimming
    spaces.sort((a, b) => 
      (b.width * b.height * b.depth) - (a.width * a.height * a.depth)
    );
    spaces.length = 25;
  }
  
  // Final sort by position - prefer lower spaces first for stability
  spaces.sort((a, b) => {
    // Prioritize spaces closer to the floor (lower Y)
    if (a.y !== b.y) return a.y - b.y;
    
    // Then prioritize spaces closer to the origin
    return (a.x + a.z) - (b.x + b.z);
  });
};

// Check if space is covered by a combination of other spaces
const isSpaceCoveredByCombination = (targetSpace: any, allSpaces: any[], skipIndex: number): boolean => {
  // Create a simple 3D grid representation of the target space
  const resolution = 5; // Check every 5 cm
  const coveredPoints = new Set();
  const totalPoints = [];
  
  // Generate points to check throughout the target space
  for (let x = targetSpace.x; x < targetSpace.x + targetSpace.width; x += resolution) {
    for (let y = targetSpace.y; y < targetSpace.y + targetSpace.height; y += resolution) {
      for (let z = targetSpace.z; z < targetSpace.z + targetSpace.depth; z += resolution) {
        // Include the exact edge points
        const checkX = Math.min(x, targetSpace.x + targetSpace.width - 0.1);
        const checkY = Math.min(y, targetSpace.y + targetSpace.height - 0.1);
        const checkZ = Math.min(z, targetSpace.z + targetSpace.depth - 0.1);
        
        const point = `${checkX},${checkY},${checkZ}`;
        totalPoints.push(point);
      }
    }
  }
  
  // Skip if no points to check
  if (totalPoints.length === 0) return false;
  
  // Check if each point is covered by any other space
  for (let i = 0; i < allSpaces.length; i++) {
    // Skip the target space and already removed spaces
    if (i === skipIndex || !allSpaces[i]) continue;
    
    const space = allSpaces[i];
    
    // Check which points this space covers
    for (const point of totalPoints) {
      if (coveredPoints.has(point)) continue;
      
      const [x, y, z] = point.split(',').map(Number);
      
      if (x >= space.x && x < space.x + space.width &&
          y >= space.y && y < space.y + space.height &&
          z >= space.z && z < space.z + space.depth) {
        coveredPoints.add(point);
      }
    }
    
    // All points covered, can remove this space
    if (coveredPoints.size === totalPoints.length) {
      return true;
    }
  }
  
  return false;
};

// Check if space1 is fully contained within space2
const isFullyContained = (space1: any, space2: any): boolean => {
  return (
    space1.x >= space2.x &&
    space1.y >= space2.y &&
    space1.z >= space2.z &&
    space1.x + space1.width <= space2.x + space2.width &&
    space1.y + space1.height <= space2.y + space2.height &&
    space1.z + space1.depth <= space2.z + space2.depth
  );
};

// Try to merge two spaces if they can form a larger continuous space
const tryMergeSpaces = (space1: any, space2: any): any => {
  // Check if spaces can be merged along X axis
  if (space1.y === space2.y && space1.z === space2.z &&
      space1.height === space2.height && space1.depth === space2.depth) {
    // Space1 is to the left of Space2
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
    // Space2 is to the left of Space1
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
  
  // Check if spaces can be merged along Y axis
  if (space1.x === space2.x && space1.z === space2.z &&
      space1.width === space2.width && space1.depth === space2.depth) {
    // Space1 is below Space2
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
    // Space2 is below Space1
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
  
  // Check if spaces can be merged along Z axis
  if (space1.x === space2.x && space1.y === space2.y &&
      space1.width === space2.width && space1.height === space2.height) {
    // Space1 is behind Space2
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
    // Space2 is behind Space1
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
      maxItemWidth = Math.max(maxItemWidth, item.width);
      maxItemHeight = Math.max(maxItemHeight, item.height);
      maxItemDepth = Math.max(maxItemDepth, item.depth);
    }
  });
  
  // Reduced buffer factor for tighter packing
  const bufferFactor = 1.1; // Slight increase to help fit all items
  const targetVolume = totalItemVolume * bufferFactor;
  
  // Calculate initial dimensions based on volume cube root, but respect aspect ratios
  const cubeRoot = Math.pow(targetVolume, 1/3);
  
  // Start with dimensions that maintain a reasonable aspect ratio but are not smaller than max item dimensions
  let initialBox: BoxDimensions = {
    width: Math.max(maxItemWidth, Math.ceil(cubeRoot * 1.05)), // Slightly wider
    height: Math.max(maxItemHeight, Math.ceil(cubeRoot * 0.9)), // Slightly shorter (better for stability)
    depth: Math.max(maxItemDepth, Math.ceil(cubeRoot * 1.05))  // Slightly deeper
  };
  
  // Binary search approach to find optimal dimensions
  let bestResult: PackingResult | null = null;
  let iterations = 20; // Increased iterations for better results
  
  // Multi-step optimization: first find a box that fits all items
  // First pass: increase size until all items fit
  let allItemsFit = false;
  let growthFactor = 1.05; // Smaller growth factor for more precise sizing
  let currentBox = { ...initialBox };
  
  while (!allItemsFit && iterations > 0) {
    const result = packItems(currentBox, itemsToProcess);
    
    if (result.unpackedItems.length === 0) {
      // All items fit, save this result
      bestResult = result;
      allItemsFit = true;
    } else {
      // Items don't fit, increase box size more intelligently
      // Find the dimension that's most constrained
      const unpackedVolume = result.unpackedItems.reduce((total, item) => 
        total + (item.width * item.height * item.depth * item.quantity), 0);
      
      // Calculate how much to grow each dimension
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
      { w: 0.98, h: 1.01, d: 1.01 },
      { w: 1.01, h: 0.98, d: 1.01 },
      { w: 1.01, h: 1.01, d: 0.98 },
      // Try different aspect ratios
      { w: 0.95, h: 1.03, d: 1.02 },
      { w: 1.03, h: 0.95, d: 1.02 },
      { w: 1.02, h: 1.03, d: 0.95 },
      // More aggressive variations
      { w: 0.93, h: 1.04, d: 1.03 },
      { w: 1.04, h: 0.93, d: 1.03 },
      { w: 1.03, h: 1.04, d: 0.93 }
    ];
    
    for (const variation of aspectVariations) {
      const testBox: BoxDimensions = {
        width: Math.max(maxItemWidth, Math.ceil(bestResult.boxDimensions.width * variation.w)),
        height: Math.max(maxItemHeight, Math.ceil(bestResult.boxDimensions.height * variation.h)),
        depth: Math.max(maxItemDepth, Math.ceil(bestResult.boxDimensions.depth * variation.d))
      };
      
      const testVolume = testBox.width * testBox.height * testBox.depth;
      
      // Only test if the new volume is less than or equal to the current best
      if (testVolume <= baseVolume * 1.01) { // Allow a tiny bit of flexibility
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
    const shrinkFactors = [0.99, 0.98, 0.97, 0.96, 0.95];
    
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
