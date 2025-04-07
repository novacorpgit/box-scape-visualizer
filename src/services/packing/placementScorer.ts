
import { Space, PackedItem } from "./types";
import { rangesOverlap, canItemBeStacked } from "./utils";

// More precise collision detection with smaller tolerance
export const checkCollisionPrecise = (
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

// NEW: Function to check if a space has support from items below it (prevents floating items)
export const checkIfSpaceHasSupport = (
  space: Space, 
  packedItems: PackedItem[],
  boxWidth: number,
  boxDepth: number
): boolean => {
  // Space is on the floor - it's supported
  if (space.y === 0) {
    return true;
  }
  
  // Define the bottom face of the space
  const bottomY = space.y - 0.001; // Small offset to check items directly below
  
  // Check if there's any item supporting this space
  for (const item of packedItems) {
    // Skip items that can't be stacked on
    if (!canItemBeStacked(item)) {
      continue;
    }
    
    // Item boundaries
    const itemLeft = item.position[0] - item.width / 2;
    const itemRight = item.position[0] + item.width / 2;
    const itemTop = item.position[1] + item.height / 2;
    const itemBack = item.position[2] - item.depth / 2;
    const itemFront = item.position[2] + item.depth / 2;
    
    // Check if item is directly below the space (within a small tolerance)
    const tolerance = 0.1;
    if (Math.abs(itemTop - space.y) < tolerance) {
      // Check horizontal overlap
      if (
        // X-axis overlap
        ((itemLeft <= space.x && itemRight >= space.x) || 
         (itemLeft <= space.x + space.width && itemRight >= space.x + space.width) ||
         (itemLeft >= space.x && itemRight <= space.x + space.width)) &&
        // Z-axis overlap
        ((itemBack <= space.z && itemFront >= space.z) || 
         (itemBack <= space.z + space.depth && itemFront >= space.z + space.depth) ||
         (itemBack >= space.z && itemFront <= space.z + space.depth))
      ) {
        // Calculate overlap area
        const overlapWidth = Math.min(itemRight, space.x + space.width) - Math.max(itemLeft, space.x);
        const overlapDepth = Math.min(itemFront, space.z + space.depth) - Math.max(itemBack, space.z);
        
        // If substantial overlap (at least 25% of the space's base area), consider it supported
        const spaceBaseArea = space.width * space.depth;
        const overlapArea = overlapWidth * overlapDepth;
        
        if (overlapArea >= 0.25 * spaceBaseArea) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Estimate risk of creating wasted spaces (with reduced penalties)
export const estimateWastedSpaceRisk = (
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

// Calculate score for a placement - lower is better
export const calculatePlacementScore = (
  space: Space, 
  orientation: any, 
  boxWidth: number, 
  boxHeight: number, 
  boxDepth: number,
  packedItems: PackedItem[]
): number => {
  // Base score components
  let score = 0;
  
  // ENHANCED: Prioritize placing items directly on the floor or on other items
  // Major bonus for floor placement
  if (space.y === 0) {
    score -= 20000; // Very large bonus for floor placement
  } else {
    // Check if item would be placed directly on another item
    let directlyOnItem = false;
    
    for (const packedItem of packedItems) {
      const packedItemTop = packedItem.position[1] + packedItem.height/2;
      
      // If this space is directly on top of a packed item
      if (Math.abs(space.y - packedItemTop) < 0.1) {
        directlyOnItem = true;
        break;
      }
    }
    
    if (directlyOnItem) {
      score -= 15000; // Large bonus for stacking directly on items
    } else {
      // Significant penalty for floating spaces
      score += 10000; 
    }
  }
  
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
  
  // Increased bonus for touching other items to encourage tight packing
  score -= touchingFacesCount * 2000;
  
  // Bonus for being close to other items (if not touching)
  if (touchingFacesCount === 0 && minDistance !== Infinity) {
    score += minDistance * 100; // Penalty increases with distance
  }
  
  // COMPONENT 3: Fit quality - how well item fits in the space
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
  score += space.y * 150; // Large penalty for height - encourages items to be placed lower
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
