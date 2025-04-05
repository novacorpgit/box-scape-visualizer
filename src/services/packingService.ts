
import { BoxDimensions, Item, PackedItem, PackingResult } from "@/types";

// This is a simplified packing algorithm
export const packItems = (box: BoxDimensions, items: Item[]): PackingResult => {
  // Deep copy items to avoid mutating the original array
  const itemsToProcess = JSON.parse(JSON.stringify(items)) as Item[];
  const packedItems: PackedItem[] = [];
  const unpackedItems: Item[] = [];

  // Sort items by volume (largest first)
  itemsToProcess.sort((a, b) => {
    const volumeA = a.width * a.height * a.depth;
    const volumeB = b.width * a.height * b.depth;
    return volumeB - volumeA;
  });

  // Basic packing algorithm (first fit)
  // In a real app, this would be replaced with a more sophisticated algorithm
  let totalVolume = 0;
  const boxVolume = box.width * box.height * box.depth;

  for (const item of itemsToProcess) {
    // Process each item according to its quantity
    for (let i = 0; i < item.quantity; i++) {
      const itemVolume = item.width * item.height * item.depth;

      // Check if the item fits in the box (simplified check)
      if (
        item.width <= box.width &&
        item.height <= box.height &&
        item.depth <= box.depth &&
        totalVolume + itemVolume <= boxVolume
      ) {
        // For demonstration, we'll place items in a grid-like pattern
        const packedItemsCount = packedItems.length;
        const gridSize = Math.ceil(Math.cbrt(packedItemsCount + 1));
        const gridPosition = packedItemsCount % (gridSize * gridSize);
        
        const xGrid = gridPosition % gridSize;
        const yGrid = Math.floor(gridPosition / gridSize) % gridSize;
        const zGrid = Math.floor(gridPosition / (gridSize * gridSize));
        
        // Calculate position based on grid
        const x = (xGrid * box.width / gridSize) + (item.width / 2);
        const y = (yGrid * box.height / gridSize) + (item.height / 2);
        const z = (zGrid * box.depth / gridSize) + (item.depth / 2);

        // Pack the item
        const packedItem: PackedItem = {
          ...item,
          id: `${item.id}-${i}`,
          position: [x, y, z],
          rotation: [0, 0, 0], // No rotation for simplicity
        };

        packedItems.push(packedItem);
        totalVolume += itemVolume;
      } else {
        // Item doesn't fit, add to unpacked
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
