
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { PackingResult } from "@/types";

interface PackingStatsProps {
  packingResult: PackingResult;
}

const PackingStats = ({ packingResult }: PackingStatsProps) => {
  if (packingResult.packedItems.length === 0) return null;
  
  return (
    <Card className="mt-4 border-green-200 bg-green-50">
      <CardHeader className="py-2">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-green-600 mr-2" />
          <CardTitle className="text-green-700 text-lg">Packing Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-0">
        <div>
          <p className="text-xs text-muted-foreground">Items Packed</p>
          <p className="text-xl font-bold text-green-700">{packingResult.packedItems.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Space Utilization</p>
          <p className="text-xl font-bold text-green-700">{packingResult.utilizationPercentage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Empty Space</p>
          <p className="text-xl font-bold text-green-700">{(100 - packingResult.utilizationPercentage).toFixed(1)}%</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackingStats;
