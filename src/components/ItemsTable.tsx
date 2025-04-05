import { useState, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@/types";
import { getRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import { Copy, ClipboardPaste, Table as TableIcon } from "lucide-react";

interface ItemsTableProps {
  onSubmit: (items: Item[]) => void;
  isDisabled: boolean;
}

const ItemsTable = ({ onSubmit, isDisabled }: ItemsTableProps) => {
  const [items, setItems] = useState<Item[]>([
    {
      id: "1",
      name: "Item 1",
      width: 20,
      height: 20,
      depth: 20,
      quantity: 1,
      weight: 1,
      maxStack: 1,
      color: getRandomColor(),
    },
  ]);

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
      maxStack: 1,
      color: getRandomColor(),
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

  const handleCellChange = (id: string, field: keyof Item, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          [field]: field === "name" ? value : Number(value) || 0 
        };
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
    
    // Get clipboard data
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    
    const text = clipboardData.getData('text');
    if (!text) return;
    
    // Split the clipboard text by rows and columns
    const rows = text.split(/\r\n|\r|\n/).filter(row => row.trim() !== '');
    
    if (rows.length === 0) return;
    
    // Check if we have a header row - simple heuristic, if first cell is non-numeric, it might be a header
    const startIndex = isNaN(Number(rows[0].split('\t')[0])) ? 1 : 0;
    
    // Map the pasted data to new items
    let newItems: Item[] = [];
    
    for (let i = startIndex; i < rows.length; i++) {
      const columns = rows[i].split('\t');
      
      // Expect that columns are in this order: Name, Width, Height, Depth, Quantity, Weight, MaxStack
      // Fill in as many columns as available
      if (columns.length >= 3) {
        const item: Item = {
          id: String(newItems.length + 1),
          name: columns[0] || `Item ${newItems.length + 1}`,
          width: Number(columns[1]) || 20,
          height: Number(columns[2]) || 20,
          depth: Number(columns[3]) || 20,
          quantity: Number(columns[4]) || 1,
          weight: Number(columns[5]) || 1,
          maxStack: Number(columns[6]) || 1,
          color: getRandomColor(),
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
    let clipboardText = "Name\tWidth\tHeight\tDepth\tQuantity\tWeight\tMaxStack\n";
    
    items.forEach(item => {
      clipboardText += `${item.name}\t${item.width}\t${item.height}\t${item.depth}\t${item.quantity}\t${item.weight}\t${item.maxStack}\n`;
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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              title="Copy to clipboard as TSV (tab-separated values)"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast.info("Paste data from Excel by clicking on a cell and pressing Ctrl+V")}
              title="Paste from Excel/Google Sheets"
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              How to Paste
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table ref={tableRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Width (cm)</TableHead>
                    <TableHead>Height (cm)</TableHead>
                    <TableHead>Depth (cm)</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Max Stack</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody onPaste={handlePaste}>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.name}
                          onChange={(e) => handleCellChange(item.id, "name", e.target.value)}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.width}
                          onChange={(e) => handleCellChange(item.id, "width", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.height}
                          onChange={(e) => handleCellChange(item.id, "height", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.depth}
                          onChange={(e) => handleCellChange(item.id, "depth", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleCellChange(item.id, "quantity", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) => handleCellChange(item.id, "weight", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.maxStack}
                          onChange={(e) => handleCellChange(item.id, "maxStack", e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeRow(item.id)}
                          className="h-8 px-2"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addRow}
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

export default ItemsTable;
