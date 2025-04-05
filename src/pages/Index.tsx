
import { useState } from "react";
import BoxDimensionsForm from "@/components/BoxDimensionsForm";
import ItemsForm from "@/components/ItemsForm";
import ItemsTable from "@/components/ItemsTable";
import BoxVisualization from "@/components/BoxVisualization";
import { PackingResult, BoxDimensions, Item } from "@/types";
import { packItems, findOptimalBoxSize } from "@/services/packingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid2X2, List, Package, Info, AlertTriangle, Maximize, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions | null>(null);
  const [packingResult, setPackingResult] = useState<PackingResult | null>(null);
  const [inputMethod, setInputMethod] = useState<"form" | "table">("table");
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);

  const handleBoxDimensionsSubmit = (dimensions: BoxDimensions) => {
    setBoxDimensions(dimensions);
    setIsOptimized(false);
    toast.success("Box dimensions set successfully!");
    
    // Clear any previous packing result when box dimensions change
    if (packingResult) {
      setPackingResult(null);
    }
  };

  const handleItemsSubmit = (items: Item[]) => {
    setCurrentItems(items);
    
    if (!boxDimensions && !isOptimized) {
      toast.error("Please set box dimensions first");
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
  };
  
  const handleOptimizeBoxSize = () => {
    if (currentItems.length === 0) {
      toast.error("Please add items first");
      return;
    }
    
    const optimizedResult = findOptimalBoxSize(currentItems);
    setPackingResult(optimizedResult);
    setBoxDimensions(optimizedResult.boxDimensions);
    setIsOptimized(true);
    
    if (optimizedResult.unpackedItems.length > 0) {
      toast.warning(`${optimizedResult.unpackedItems.length} items couldn't be packed even with optimized box`);
    } else {
      toast.success(`Optimized box size: ${optimizedResult.boxDimensions.width}×${optimizedResult.boxDimensions.height}×${optimizedResult.boxDimensions.depth} cm`);
    }
  };

  const resetAll = () => {
    setBoxDimensions(null);
    setPackingResult(null);
    setCurrentItems([]);
    setIsOptimized(false);
    toast.info("Reset all data");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">3D Shipping Box Planner</h1>
          <p className="text-lg text-muted-foreground">
            Optimize your packaging with our 3D visualization tool
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Input Data</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetAll}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <BoxDimensionsForm 
                  onSubmit={handleBoxDimensionsSubmit} 
                  initialDimensions={boxDimensions}
                />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Items to Pack</h3>
                    <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as "form" | "table")} className="w-auto">
                      <TabsList>
                        <TabsTrigger value="table">
                          <Grid2X2 className="h-4 w-4 mr-2" />
                          Table View
                        </TabsTrigger>
                        <TabsTrigger value="form">
                          <List className="h-4 w-4 mr-2" />
                          Form View
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {inputMethod === "form" ? (
                    <ItemsForm 
                      onSubmit={handleItemsSubmit} 
                      isDisabled={false}
                    />
                  ) : (
                    <ItemsTable
                      onSubmit={handleItemsSubmit}
                      isDisabled={false}
                    />
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    className="flex-1" 
                    disabled={currentItems.length === 0} 
                    onClick={handleOptimizeBoxSize}
                    variant="outline"
                  >
                    <Maximize className="h-4 w-4 mr-2" />
                    Optimize Box Size
                  </Button>
                  <Button 
                    className="flex-1" 
                    disabled={!boxDimensions || currentItems.length === 0} 
                    onClick={() => handleItemsSubmit(currentItems)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Calculate Packing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <div className="h-[650px]">
              {packingResult ? (
                <BoxVisualization 
                  boxDimensions={packingResult.boxDimensions}
                  packedItems={packingResult.packedItems}
                  utilizationPercentage={packingResult.utilizationPercentage}
                  packingInstructions={packingResult.packingInstructions}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-20">
                    <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
                    <h3 className="text-xl font-medium mb-2">3D Visualization</h3>
                    <p className="text-muted-foreground max-w-md">
                      Enter box dimensions and items to see your packing layout visualized in 3D
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {isOptimized && packingResult && (
              <Card className="mt-6 border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Maximize className="h-5 w-5 text-blue-600 mr-2" />
                    <CardTitle className="text-blue-700 text-lg">Optimized Box</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2 text-sm">
                    The optimal box size for your items:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                      Width: {packingResult.boxDimensions.width} cm
                    </Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                      Height: {packingResult.boxDimensions.height} cm
                    </Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                      Depth: {packingResult.boxDimensions.depth} cm
                    </Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                      Volume: {packingResult.boxDimensions.width * packingResult.boxDimensions.height * packingResult.boxDimensions.depth} cm³
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {packingResult && packingResult.unpackedItems.length > 0 && (
              <Card className="mt-4 border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <CardTitle className="text-yellow-700 text-lg">Unpacked Items</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">
                    The following items couldn't fit in the box:
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {packingResult.unpackedItems.map((item, index) => (
                        <li key={index} className="border border-yellow-200 rounded p-2 text-sm">
                          <span className="font-medium">{item.name}</span> - {item.width}×{item.height}×{item.depth}cm
                          {item.quantity > 1 && <span className="text-xs ml-1 bg-yellow-200 rounded-full px-2 py-0.5">×{item.quantity}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {packingResult && packingResult.packedItems.length > 0 && (
              <Card className="mt-4 border-green-200 bg-green-50">
                <CardHeader className="py-2">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-green-600 mr-2" />
                    <CardTitle className="text-green-700 text-lg">Packing Statistics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Items Packed</p>
                    <p className="text-xl font-bold text-green-700">{packingResult.packedItems.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Space Utilization</p>
                    <p className="text-xl font-bold text-green-700">{packingResult.utilizationPercentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empty Space</p>
                    <p className="text-xl font-bold text-green-700">{(100 - packingResult.utilizationPercentage).toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
