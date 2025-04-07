
import { useState } from "react";
import BoxDimensionsForm from "@/components/BoxDimensionsForm";
import { PackingResult, BoxDimensions, Item } from "@/types";
import { packItems, findOptimalBoxSize } from "@/services/packingService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Boxes, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import ItemsPanel from "@/components/items/ItemsPanel";
import VisualizationPanel from "@/components/visualization/VisualizationPanel";

const Index = () => {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions | null>(null);
  const [packingResult, setPackingResult] = useState<PackingResult | null>(null);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);
  const [activeTab, setActiveTab] = useState("dimensions");

  const handleBoxDimensionsSubmit = (dimensions: BoxDimensions) => {
    setBoxDimensions(dimensions);
    setIsOptimized(false);
    toast.success("Box dimensions set successfully!");
    
    if (packingResult) {
      setPackingResult(null);
    }
    
    setActiveTab("items");
  };

  const handleItemsSubmit = (items: Item[]) => {
    setCurrentItems(items);
    
    if (!boxDimensions && !isOptimized) {
      toast.error("Please set box dimensions first");
      setActiveTab("dimensions");
      return;
    }

    const result = packItems(boxDimensions!, items);
    setPackingResult(result);
    setIsOptimized(false);

    if (result.unpackedItems.length > 0) {
      toast.warning(`${result.unpackedItems.length} items couldn't be packed due to space constraints`);
    } else {
      toast.success("All items packed successfully!");
    }
    
    setActiveTab("visualization");
  };
  
  const handleOptimizeBoxSize = () => {
    if (currentItems.length === 0) {
      toast.error("Please add items first");
      setActiveTab("items");
      return;
    }
    
    const optimizedResult = findOptimalBoxSize(currentItems, true);
    setPackingResult(optimizedResult);
    setBoxDimensions(optimizedResult.boxDimensions);
    setIsOptimized(true);
    
    if (optimizedResult.unpackedItems.length > 0) {
      toast.warning(`${optimizedResult.unpackedItems.length} items couldn't be packed even with optimized box`);
    } else {
      toast.success(`Optimized box size: ${optimizedResult.boxDimensions.width}×${optimizedResult.boxDimensions.height}×${optimizedResult.boxDimensions.depth} cm`);
    }
    
    setActiveTab("visualization");
  };

  const resetAll = () => {
    setBoxDimensions(null);
    setPackingResult(null);
    setCurrentItems([]);
    setIsOptimized(false);
    setActiveTab("dimensions");
    toast.info("Reset all data");
  };

  const handleTabChange = (value: string) => {
    if (value === "items" && !boxDimensions) {
      toast.error("Please set box dimensions first");
      return;
    }
    
    if (value === "visualization" && (!boxDimensions || currentItems.length === 0)) {
      toast.error("Please set box dimensions and add items first");
      return;
    }
    
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        <Header onReset={resetAll} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dimensions" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Box Dimensions
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Items to Pack
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              3D Visualization
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensions" className="space-y-4">
            <BoxDimensionsForm 
              onSubmit={handleBoxDimensionsSubmit} 
              initialDimensions={boxDimensions}
            />
            
            {boxDimensions && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => setActiveTab("items")}>
                  Continue to Items
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="items" className="space-y-4">
            <ItemsPanel 
              currentItems={currentItems}
              onItemsSubmit={handleItemsSubmit}
              onOptimize={handleOptimizeBoxSize}
              onBack={() => setActiveTab("dimensions")}
              boxDimensions={boxDimensions}
            />
          </TabsContent>
          
          <TabsContent value="visualization" className="space-y-4">
            <VisualizationPanel 
              packingResult={packingResult}
              currentItems={currentItems}
              isOptimized={isOptimized}
              onOptimize={handleOptimizeBoxSize}
              onClear={() => setPackingResult(null)}
              onBack={() => setActiveTab("items")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
