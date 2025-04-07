
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
}

const Header = ({ onReset }: HeaderProps) => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold text-primary mb-2">3D Shipping Box Planner</h1>
      <p className="text-lg text-muted-foreground">
        Optimize your packaging with our 3D visualization tool
      </p>
      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset All
        </Button>
      </div>
    </header>
  );
};

export default Header;
