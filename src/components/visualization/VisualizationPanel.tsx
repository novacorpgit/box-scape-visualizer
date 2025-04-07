
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageCheck } from "lucide-react";
import { PackingResult, Item, OptimizeOptions } from "@/types";
import BoxVisualization from "@/components/BoxVisualization";
import OptimizedBoxInfo from "@/components/visualization/OptimizedBoxInfo";
import UnpackedItems from "@/components/visualization/UnpackedItems";
import PackingStats from "@/components/visualization/PackingStats";
import OptimizePrompt from "@/components/visualization/OptimizePrompt";
import { toast } from "sonner";

interface VisualizationPanelProps {
  packingResult: PackingResult | null;
  currentItems: Item[];
  isOptimized: boolean;
  onOptimize: (options?: OptimizeOptions) => void;
  onClear: () => void;
  onBack: () => void;
}

const VisualizationPanel = ({ 
  packingResult, 
  currentItems, 
  isOptimized, 
  onOptimize, 
  onClear, 
  onBack 
}: VisualizationPanelProps) => {
  return (
    <div className="space-y-4">
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
              <PackageCheck className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
              <h3 className="text-xl font-medium mb-2">3D Visualization</h3>
              <p className="text-muted-foreground max-w-md">
                Enter box dimensions and items to see your packing layout visualized in 3D
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {currentItems.length > 0 && !isOptimized && (
        <OptimizePrompt onOptimize={onOptimize} />
      )}

      {isOptimized && packingResult && (
        <OptimizedBoxInfo packingResult={packingResult} />
      )}

      {packingResult && (
        <UnpackedItems unpackedItems={packingResult.unpackedItems} />
      )}
      
      {packingResult && (
        <PackingStats packingResult={packingResult} />
      )}
      
      <div className="flex justify-between mt-4">
        <Button onClick={onBack} variant="outline">
          Back to Items
        </Button>
        {packingResult && (
          <Button 
            onClick={() => {
              onClear();
              toast.info("Visualization cleared");
            }} 
            variant="outline" 
            className="text-destructive"
          >
            Clear Visualization
          </Button>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
