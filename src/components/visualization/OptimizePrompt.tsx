
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";

interface OptimizePromptProps {
  onOptimize: () => void;
}

const OptimizePrompt = ({ onOptimize }: OptimizePromptProps) => {
  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-700 mb-1">Optimize Box Size</h3>
            <p className="text-sm text-muted-foreground">
              Find the optimal box size for your items to ensure all items fit while minimizing wasted space
            </p>
          </div>
          <Button 
            onClick={onOptimize} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Optimize Box
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizePrompt;
