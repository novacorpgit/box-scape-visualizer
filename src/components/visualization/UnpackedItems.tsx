
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Item } from "@/types";

interface UnpackedItemsProps {
  unpackedItems: Item[];
}

const UnpackedItems = ({ unpackedItems }: UnpackedItemsProps) => {
  if (unpackedItems.length === 0) return null;
  
  return (
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
            {unpackedItems.map((item, index) => (
              <li key={index} className="border border-yellow-200 rounded p-2 text-sm">
                <span className="font-medium">{item.name}</span> - {item.width}×{item.height}×{item.depth}cm
                {item.quantity > 1 && <span className="text-xs ml-1 bg-yellow-200 rounded-full px-2 py-0.5">×{item.quantity}</span>}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnpackedItems;
