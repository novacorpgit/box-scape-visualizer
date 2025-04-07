
import { TableCell, TableRow } from "@/components/ui/table";
import { Item } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ItemTableRowProps {
  item: Item;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Item, value: string | boolean) => void;
}

const ItemTableRow = ({ item, onRemove, onChange }: ItemTableRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <Input
          value={item.name}
          onChange={(e) => onChange(item.id, "name", e.target.value)}
          className="min-w-[120px]"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          value={item.width}
          onChange={(e) => onChange(item.id, "width", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          value={item.height}
          onChange={(e) => onChange(item.id, "height", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          value={item.depth}
          onChange={(e) => onChange(item.id, "depth", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange(item.id, "quantity", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0.1"
          step="0.1"
          value={item.weight}
          onChange={(e) => onChange(item.id, "weight", e.target.value)}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          <Checkbox 
            id={`maxStack-${item.id}`} 
            checked={item.maxStack === true || (typeof item.maxStack === 'boolean' && item.maxStack)}
            onCheckedChange={(checked) => onChange(item.id, "maxStack", !!checked)}
            className="mx-auto"
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          <Checkbox 
            id={`allowRotation-${item.id}`} 
            checked={item.allowRotation !== false}
            onCheckedChange={(checked) => onChange(item.id, "allowRotation", !!checked)}
            className="mx-auto"
          />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(item.id)}
          className="h-8 px-2"
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ItemTableRow;
