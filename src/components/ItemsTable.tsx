
import { useState, useCallback, useRef, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@/types";
import { getRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import ItemTableHeader from "@/components/items/TableHeader";
import ItemTableRow from "@/components/items/TableRow";
import TableActions from "@/components/items/TableActions";
import ItemFormActions from "@/components/items/ItemFormActions";

interface ItemsTableProps {
  onSubmit: (items: Item[]) => void;
  isDisabled: boolean;
  initialItems?: Item[];
}

const ItemsTable = ({ onSubmit, isDisabled, initialItems }: ItemsTableProps) => {
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

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const tableRef = useRef<HTMLTableElement>(null);

  const addRow = () => {
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

  const removeRow = (id: string) => {
    if (items.length === 1) {
      toast.error("You need at least one item");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleCellChange = (id: string, field: keyof Item, value: string | boolean) => {
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    
    const text = clipboardData.getData('text');
    if (!text) return;
    
    const rows = text.split(/\r\n|\r|\n/).filter(row => row.trim() !== '');
    
    if (rows.length === 0) return;
    
    const startIndex = isNaN(Number(rows[0].split('\t')[0])) ? 1 : 0;
    
    let newItems: Item[] = [];
    
    for (let i = startIndex; i < rows.length; i++) {
      const columns = rows[i].split('\t');
      
      if (columns.length >= 3) {
        const item: Item = {
          id: String(newItems.length + 1),
          name: columns[0] || `Item ${newItems.length + 1}`,
          width: Number(columns[1]) || 20,
          height: Number(columns[2]) || 20,
          depth: Number(columns[3]) || 20,
          quantity: Number(columns[4]) || 1,
          weight: Number(columns[5]) || 1,
          maxStack: columns[6] ? (columns[6].toLowerCase() === 'yes' || columns[6] === '1' || columns[6].toLowerCase() === 'true') : true,
          color: getRandomColor(),
          allowRotation: columns[7] ? (columns[7].toLowerCase() === 'yes' || columns[7] === '1' || columns[7].toLowerCase() === 'true') : true,
        };
        newItems.push(item);
      }
    }
    
    if (newItems.length > 0) {
      setItems(newItems);
      toast.success(`Imported ${newItems.length} items from clipboard`);
    } else {
      toast.error("Could not parse items from clipboard data");
    }
  }, []);

  const copyToClipboard = () => {
    let clipboardText = "Name\tWidth\tHeight\tDepth\tQuantity\tWeight\tMaxStack\tAllowRotation\n";
    
    items.forEach(item => {
      clipboardText += `${item.name}\t${item.width}\t${item.height}\t${item.depth}\t${item.quantity}\t${item.weight}\t${item.maxStack === true ? "Yes" : "No"}\t${item.allowRotation !== false ? "Yes" : "No"}\n`;
    });
    
    navigator.clipboard.writeText(clipboardText).then(() => {
      toast.success("Copied items to clipboard");
    }, () => {
      toast.error("Failed to copy items to clipboard");
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Items to Pack</CardTitle>
          <TableActions onCopyToClipboard={copyToClipboard} />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table ref={tableRef}>
                <ItemTableHeader />
                <TableBody onPaste={handlePaste}>
                  {items.map((item) => (
                    <ItemTableRow
                      key={item.id}
                      item={item}
                      onRemove={removeRow}
                      onChange={handleCellChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <ItemFormActions 
            onAddItem={addRow}
            isDisabled={isDisabled}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;
