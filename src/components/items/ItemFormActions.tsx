
import { Button } from "@/components/ui/button";

interface ItemFormActionsProps {
  onAddItem: () => void;
  isDisabled: boolean;
}

const ItemFormActions = ({ onAddItem, isDisabled }: ItemFormActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onAddItem}
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
  );
};

export default ItemFormActions;
