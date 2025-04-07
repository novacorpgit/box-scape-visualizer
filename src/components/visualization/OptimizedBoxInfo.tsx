
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Maximize } from "lucide-react";
import { PackingResult } from "@/types";

interface OptimizedBoxInfoProps {
  packingResult: PackingResult;
}

const OptimizedBoxInfo = ({ packingResult }: OptimizedBoxInfoProps) => {
  return (
    <Card className="mt-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Maximize className="h-5 w-5 text-blue-600 mr-2" />
          <CardTitle className="text-blue-700 text-lg">Optimized Box</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-2 text-sm">
          The optimal box size for your items:
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
            Width: {packingResult.boxDimensions.width} cm
          </Badge>
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
            Height: {packingResult.boxDimensions.height} cm
          </Badge>
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
            Depth: {packingResult.boxDimensions.depth} cm
          </Badge>
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
            Volume: {packingResult.boxDimensions.width * packingResult.boxDimensions.height * packingResult.boxDimensions.depth} cm³
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizedBoxInfo;
