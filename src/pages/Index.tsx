
import { useState } from "react";
import BoxDimensionsForm from "@/components/BoxDimensionsForm";
import ItemsForm from "@/components/ItemsForm";
import BoxVisualization from "@/components/BoxVisualization";
import { PackingResult, BoxDimensions, Item } from "@/types";
import { packItems } from "@/services/packingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions | null>(null);
  const [packingResult, setPackingResult] = useState<PackingResult | null>(null);

  const handleBoxDimensionsSubmit = (dimensions: BoxDimensions) => {
    setBoxDimensions(dimensions);
    toast.success("Box dimensions set successfully!");
  };

  const handleItemsSubmit = (items: Item[]) => {
    if (!boxDimensions) {
      toast.error("Please set box dimensions first");
      return;
    }

    const result = packItems(boxDimensions, items);
    setPackingResult(result);

    if (result.unpackedItems.length > 0) {
      toast.warning(`${result.unpackedItems.length} items couldn't be packed due to space constraints`);
    } else {
      toast.success("All items packed successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">3D Shipping Box Planner</h1>
          <p className="text-lg text-muted-foreground">
            Optimize your packaging with our 3D visualization tool
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <BoxDimensionsForm onSubmit={handleBoxDimensionsSubmit} />
            <ItemsForm 
              onSubmit={handleItemsSubmit} 
              isDisabled={!boxDimensions}
            />

            {packingResult && packingResult.unpackedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-yellow-500">Unpacked Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    The following items couldn't fit in the box:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    {packingResult.unpackedItems.map((item, index) => (
                      <li key={index}>
                        {item.name} - {item.width}x{item.height}x{item.depth}cm (Qty: {item.quantity})
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="h-[600px]">
            {packingResult ? (
              <BoxVisualization 
                boxDimensions={boxDimensions!}
                packedItems={packingResult.packedItems}
                utilizationPercentage={packingResult.utilizationPercentage}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Enter box dimensions and items to see the 3D visualization
                  </p>
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
