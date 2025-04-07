
import { Space } from "./types";
import { isFullyContained } from "./utils";

// IMPROVED: Space splitting algorithm - prioritize larger continuous spaces
export const splitSpaceImproved = (
  space: Space,
  itemX: number,
  itemY: number,
  itemZ: number,
  itemWidth: number,
  itemHeight: number,
  itemDepth: number
): Space[] => {
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
  
  // Space below the item (Y-) - We can omit this to enforce gravity constraint
  // Items should always be placed on floor or on top of other items
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
  
  // Filter out spaces that are too small to be useful
  const viableSpaces = possibleSpaces.filter(s => 
    s.width >= 0.5 && s.height >= 0.5 && s.depth >= 0.5
  );
  
  // Sort by volume (largest first)
  viableSpaces.sort((a, b) => 
    (b.width * b.height * b.depth) - (a.width * a.height * a.depth)
  );
  
  return viableSpaces.length > 0 ? viableSpaces : [];
};

// Try to merge two spaces if they can form a larger continuous space
export const tryMergeSpaces = (space1: Space, space2: Space): Space | null => {
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

// IMPROVED: Space cleanup with better handling of small spaces
export const cleanupSpacesImproved = (spaces: Space[]): void => {
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
    // Prioritize spaces on the floor
    if (a.y === 0 && b.y !== 0) return -1;
    if (a.y !== 0 && b.y === 0) return 1;
    
    // Then prioritize spaces closer to the floor (lower Y)
    if (a.y !== b.y) return a.y - b.y;
    
    // Then prioritize spaces closer to the origin
    return (a.x + a.z) - (b.x + b.z);
  });
};
