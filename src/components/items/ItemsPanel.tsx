
import { useState } from "react";
import ItemsForm from "@/components/ItemsForm";
import ItemsTable from "@/components/ItemsTable";
import { Item } from "@/types";
import { Button } from "@/components/ui/button";
import { Maximize, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid2X2, List } from "lucide-react";

interface ItemsPanelProps {
  currentItems: Item[];
  onItemsSubmit: (items: Item[]) => void;
  onOptimize: () => void;
  onBack: () => void;
  boxDimensions: BoxDimensions | null;
}

const ItemsPanel = ({ 
  currentItems, 
  onItemsSubmit, 
  onOptimize, 
  onBack,
  boxDimensions
}: ItemsPanelProps) => {
  const [inputMethod, setInputMethod] = useState<"form" | "table">("table");

  return (
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
          onSubmit={onItemsSubmit} 
          isDisabled={false}
          initialItems={currentItems.length > 0 ? currentItems : undefined}
        />
      ) : (
        <ItemsTable
          onSubmit={onItemsSubmit}
          isDisabled={false}
          initialItems={currentItems.length > 0 ? currentItems : undefined}
        />
      )}

      <div className="flex justify-between gap-4 mt-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back to Dimensions
        </Button>
        
        <div className="flex gap-2">
          <Button 
            disabled={currentItems.length === 0} 
            onClick={onOptimize}
            variant="outline"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Optimize Box Size
          </Button>
          <Button 
            disabled={!boxDimensions || currentItems.length === 0} 
            onClick={() => onItemsSubmit(currentItems)}
          >
            <Package className="h-4 w-4 mr-2" />
            Calculate Packing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemsPanel;
