
import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import { BoxDimensions, PackedItem } from "@/types";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BoxVisualizationProps {
  boxDimensions: BoxDimensions;
  packedItems: PackedItem[];
  utilizationPercentage: number;
}

const BoxVisualization = ({
  boxDimensions,
  packedItems,
  utilizationPercentage,
}: BoxVisualizationProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current);
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "box-packing-visualization.png";
      link.click();
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
      console.error("Error downloading image:", error);
    }
  };

  // Function to scale down dimensions for better visualization
  const scaleDown = (value: number) => value / 50;

  // Scaled box dimensions
  const scaledWidth = scaleDown(boxDimensions.width);
  const scaledHeight = scaleDown(boxDimensions.height);
  const scaledDepth = scaleDown(boxDimensions.depth);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>3D Box Visualization</CardTitle>
          <Button onClick={downloadImage} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Space Utilization: {utilizationPercentage.toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent className="flex-grow relative">
        <div ref={canvasRef} className="w-full h-full min-h-[400px]">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            
            {/* Box wireframe */}
            <mesh position={[0, 0, 0]} scale={[1, 1, 1]}>
              <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
              <meshBasicMaterial wireframe={true} color="#000000" />
            </mesh>

            {/* Packed items */}
            {packedItems.map((item) => {
              const scaledItemWidth = scaleDown(item.width);
              const scaledItemHeight = scaleDown(item.height);
              const scaledItemDepth = scaleDown(item.depth);
              
              // Adjust position to be relative to the center of the box
              const adjustX = (scaledWidth / 2) - scaleDown(item.position[0]);
              const adjustY = (scaledHeight / 2) - scaleDown(item.position[1]);
              const adjustZ = (scaledDepth / 2) - scaleDown(item.position[2]);

              return (
                <mesh
                  key={item.id}
                  position={[-adjustX, -adjustY, -adjustZ]}
                  rotation={item.rotation.map(r => r * Math.PI / 180) as [number, number, number]}
                >
                  <boxGeometry args={[scaledItemWidth, scaledItemHeight, scaledItemDepth]} />
                  <meshStandardMaterial color={item.color} />
                </mesh>
              );
            })}

            <OrbitControls 
              enableDamping 
              dampingFactor={0.25} 
              rotateSpeed={0.5}
              minDistance={2}
              maxDistance={20}
            />
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
          </Canvas>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxVisualization;
