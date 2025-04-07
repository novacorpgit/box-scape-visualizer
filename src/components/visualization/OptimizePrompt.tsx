
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, RotateCw, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface OptimizePromptProps {
  onOptimize: (options: { allowRotation: boolean; allowStacking: boolean }) => void;
}

const OptimizePrompt = ({ onOptimize }: OptimizePromptProps) => {
  const [allowRotation, setAllowRotation] = useState(true);
  const [allowStacking, setAllowStacking] = useState(true);

  // Handle optimization with current settings
  const handleOptimize = () => {
    onOptimize({ allowRotation, allowStacking });
  };

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-blue-700 mb-1">Optimize Box Size</h3>
            <p className="text-sm text-muted-foreground">
              Find the optimal box size for your items to ensure all items fit while minimizing wasted space
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-rotation"
                checked={allowRotation}
                onCheckedChange={setAllowRotation}
              />
              <div className="flex items-center gap-1">
                <Label htmlFor="allow-rotation" className="cursor-pointer">
                  Allow Rotation
                </Label>
                <RotateCw className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-stacking"
                checked={allowStacking}
                onCheckedChange={setAllowStacking}
              />
              <div className="flex items-center gap-1">
                <Label htmlFor="allow-stacking" className="cursor-pointer">
                  Allow Stacking
                </Label>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <Button 
              onClick={handleOptimize} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Maximize className="h-4 w-4 mr-2" />
              Optimize Box
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizePrompt;
