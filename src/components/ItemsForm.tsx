
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@/types";
import { getRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import ItemCard from "@/components/items/ItemCard";
import ItemFormActions from "@/components/items/ItemFormActions";

interface ItemsFormProps {
  onSubmit: (items: Item[]) => void;
  isDisabled: boolean;
  initialItems?: Item[];
}

const ItemsForm = ({ onSubmit, isDisabled, initialItems }: ItemsFormProps) => {
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
            <ItemCard 
              key={item.id}
              item={item}
              index={index}
              onRemove={removeItem}
              onChange={handleItemChange}
            />
          ))}
          
          <ItemFormActions 
            onAddItem={addItem}
            isDisabled={isDisabled}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemsForm;
