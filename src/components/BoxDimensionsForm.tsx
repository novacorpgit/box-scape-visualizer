
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoxDimensions } from "@/types";

interface BoxDimensionsFormProps {
  onSubmit: (dimensions: BoxDimensions) => void;
}

const BoxDimensionsForm = ({ onSubmit }: BoxDimensionsFormProps) => {
  const [dimensions, setDimensions] = useState<BoxDimensions>({
    width: 100,
    height: 100,
    depth: 100,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: Number(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(dimensions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Box Dimensions</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm)</Label>
              <Input
                id="width"
                name="width"
                type="number"
                min="1"
                value={dimensions.width}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                min="1"
                value={dimensions.height}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">Depth (cm)</Label>
              <Input
                id="depth"
                name="depth"
                type="number"
                min="1"
                value={dimensions.depth}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">Set Box Dimensions</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BoxDimensionsForm;
