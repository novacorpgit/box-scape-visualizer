
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoxDimensions } from "@/types";
import { Package, Box, Boxes } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Standard box size templates
const BOX_TEMPLATES = [
  { name: "Small", width: 30, height: 20, depth: 15 },
  { name: "Medium", width: 50, height: 40, depth: 30 },
  { name: "Large", width: 80, height: 60, depth: 40 },
  { name: "XL", width: 120, height: 80, depth: 60 },
];

interface BoxDimensionsFormProps {
  onSubmit: (dimensions: BoxDimensions) => void;
  initialDimensions?: BoxDimensions | null;
}

const BoxDimensionsForm = ({ onSubmit, initialDimensions }: BoxDimensionsFormProps) => {
  const [dimensions, setDimensions] = useState<BoxDimensions>({
    width: 100,
    height: 100,
    depth: 100,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (initialDimensions) {
      setDimensions(initialDimensions);
      // Check if the initialDimensions match any template
      const matchingTemplate = BOX_TEMPLATES.find(
        (template) => 
          template.width === initialDimensions.width &&
          template.height === initialDimensions.height &&
          template.depth === initialDimensions.depth
      );
      setSelectedTemplate(matchingTemplate?.name || null);
    }
  }, [initialDimensions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: Number(value) || 0
    }));
    setSelectedTemplate(null); // Clear template selection when custom dimensions are entered
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(dimensions);
  };

  const handleTemplateSelect = (value: string) => {
    const template = BOX_TEMPLATES.find(t => t.name === value);
    if (template) {
      setDimensions({
        width: template.width,
        height: template.height,
        depth: template.depth
      });
      setSelectedTemplate(value);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-primary">
          <Package className="mr-2 h-5 w-5" />
          Box Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Standard Box Templates</Label>
            <ToggleGroup type="single" value={selectedTemplate || ""} onValueChange={handleTemplateSelect} className="justify-start flex-wrap">
              {BOX_TEMPLATES.map((template) => (
                <ToggleGroupItem 
                  key={template.name} 
                  value={template.name} 
                  className="px-3 py-1 gap-1"
                  aria-label={`Select ${template.name} box template`}
                >
                  <Box className="h-4 w-4" />
                  {template.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Custom Dimensions</Label>
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
                  className="focus:border-primary"
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
                  className="focus:border-primary"
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
                  className="focus:border-primary"
                />
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            {initialDimensions ? "Update Box Dimensions" : "Set Box Dimensions"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BoxDimensionsForm;
