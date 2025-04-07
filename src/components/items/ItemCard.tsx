
import { Item } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, Trash } from "lucide-react";

interface ItemCardProps {
  item: Item;
  index: number;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Item, value: string | number | boolean) => void;
}

const ItemCard = ({ item, index, onRemove, onChange }: ItemCardProps) => {
  return (
    <div className="p-4 border rounded-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Item {index + 1}</h3>
        <Button 
          type="button" 
          variant="destructive" 
          size="icon" 
          onClick={() => onRemove(item.id)}
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
            onChange={(e) => onChange(item.id, "name", e.target.value)}
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
            onChange={(e) => onChange(item.id, "quantity", e.target.value)}
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
            onChange={(e) => onChange(item.id, "width", e.target.value)}
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
            onChange={(e) => onChange(item.id, "height", e.target.value)}
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
            onChange={(e) => onChange(item.id, "depth", e.target.value)}
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
            onChange={(e) => onChange(item.id, "weight", e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex flex-col space-y-4 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`allowRotation-${item.id}`} 
            checked={item.allowRotation !== false}
            onCheckedChange={(checked) => onChange(item.id, "allowRotation", !!checked)}
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
            checked={item.maxStack === true || (typeof item.maxStack === 'boolean' && item.maxStack)}
            onCheckedChange={(checked) => onChange(item.id, "maxStack", !!checked)}
          />
          <div className="flex items-center gap-1">
            <Label htmlFor={`maxStack-${item.id}`} className="cursor-pointer">
              Allow stacking on top of other items
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
