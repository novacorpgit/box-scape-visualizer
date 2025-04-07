import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@/types";
import { getRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import { Trash, RotateCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ItemsFormProps {
  onSubmit: (items: Item[]) => void;
  isDisabled: boolean;
}

const ItemsForm = ({ onSubmit, isDisabled }: ItemsFormProps) => {
  const [items, setItems] = useState<Item[]>([
    {
      id: "1",
      name: "Item 1",
      width: 20,
      height: 20,
      depth: 20,
      quantity: 1,
      weight: 1,
      maxStack: true,
      color: getRandomColor(),
      allowRotation: true,
    },
  ]);

  const addItem = () => {
    const newItem: Item = {
      id: String(items.length + 1),
      name: `Item ${items.length + 1}`,
      width: 20,
      height: 20,
      depth: 20,
      quantity: 1,
      weight: 1,
      maxStack: true,
      color: getRandomColor(),
      allowRotation: true,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("You need at least one item");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof Item, value: number | string | boolean) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === "name") {
          return { ...item, [field]: value as string };
        } else if (field === "allowRotation" || field === "maxStack") {
          return { ...item, [field]: value as boolean };
        } else {
          return { ...item, [field]: Number(value) || 0 };
        }
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items to Pack</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Item {index + 1}</h3>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => removeItem(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${item.id}`}>Name</Label>
                  <Input
                    id={`name-${item.id}`}
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`width-${item.id}`}>Width (cm)</Label>
                  <Input
                    id={`width-${item.id}`}
                    type="number"
                    min="1"
                    value={item.width}
                    onChange={(e) => handleItemChange(item.id, "width", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`height-${item.id}`}>Height (cm)</Label>
                  <Input
                    id={`height-${item.id}`}
                    type="number"
                    min="1"
                    value={item.height}
                    onChange={(e) => handleItemChange(item.id, "height", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`depth-${item.id}`}>Depth (cm)</Label>
                  <Input
                    id={`depth-${item.id}`}
                    type="number"
                    min="1"
                    value={item.depth}
                    onChange={(e) => handleItemChange(item.id, "depth", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`weight-${item.id}`}>Weight (kg)</Label>
                  <Input
                    id={`weight-${item.id}`}
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.weight}
                    onChange={(e) => handleItemChange(item.id, "weight", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`allowRotation-${item.id}`} 
                    checked={item.allowRotation !== false}
                    onCheckedChange={(checked) => handleItemChange(item.id, "allowRotation", !!checked)}
                  />
                  <div className="flex items-center gap-1">
                    <Label htmlFor={`allowRotation-${item.id}`} className="cursor-pointer">
                      Allow rotation and flipping
                    </Label>
                    <RotateCw className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`maxStack-${item.id}`} 
                    checked={item.maxStack === true || (typeof item.maxStack === 'number' && item.maxStack > 0)}
                    onCheckedChange={(checked) => handleItemChange(item.id, "maxStack", !!checked)}
                  />
                  <div className="flex items-center gap-1">
                    <Label htmlFor={`maxStack-${item.id}`} className="cursor-pointer">
                      Allow stacking on top of other items
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex flex-col gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addItem}
            >
              Add Another Item
            </Button>
            <Button 
              type="submit" 
              disabled={isDisabled}
            >
              Calculate Packing Layout
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemsForm;
