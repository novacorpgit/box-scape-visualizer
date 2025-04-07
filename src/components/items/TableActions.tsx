
import { Button } from "@/components/ui/button";
import { Copy, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface TableActionsProps {
  onCopyToClipboard: () => void;
}

const TableActions = ({ onCopyToClipboard }: TableActionsProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onCopyToClipboard}
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
  );
};

export default TableActions;
