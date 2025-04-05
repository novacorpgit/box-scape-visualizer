
import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Center, Grid, Environment } from "@react-three/drei";
import { BoxDimensions, PackedItem } from "@/types";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
  const controlsRef = useRef<any>(null);

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

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      toast.success("Camera view reset");
    }
  };

  // Function to scale down dimensions for better visualization
  const scaleDown = (value: number) => value / 100;

  // Scaled box dimensions
  const scaledWidth = scaleDown(boxDimensions.width);
  const scaledHeight = scaleDown(boxDimensions.height);
  const scaledDepth = scaleDown(boxDimensions.depth);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-primary">3D Box Visualization</CardTitle>
          <div className="flex gap-2">
            <Button onClick={resetCamera} variant="outline" size="sm" title="Reset view">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={downloadImage} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Save Image
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground flex items-center">
          <div className="mr-4 font-medium">
            Space Utilization: <span className="text-primary">{utilizationPercentage.toFixed(2)}%</span>
          </div>
          <div className="text-xs bg-muted p-1 rounded">
            Box: {boxDimensions.width}×{boxDimensions.height}×{boxDimensions.depth} cm
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow relative p-0 overflow-hidden">
        <div ref={canvasRef} className="w-full h-full min-h-[400px]">
          <Canvas 
            camera={{ position: [3, 3, 3], fov: 50 }}
            shadows
            gl={{ preserveDrawingBuffer: true }}
          >
            <color attach="background" args={["#f8fafc"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            
            {/* Center everything */}
            <Center>
              {/* Box container */}
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
                <meshStandardMaterial wireframe={true} color="#475569" opacity={0.3} transparent />
              </mesh>
              
              {/* Packed items */}
              {packedItems.map((item) => {
                const scaledItemWidth = scaleDown(item.width);
                const scaledItemHeight = scaleDown(item.height);
                const scaledItemDepth = scaleDown(item.depth);
                
                // Calculate item position relative to box center
                const offsetX = (scaledWidth / 2) - scaleDown(item.position[0]) - (scaledItemWidth / 2);
                const offsetY = (scaledHeight / 2) - scaleDown(item.position[1]) - (scaledItemHeight / 2);
                const offsetZ = (scaledDepth / 2) - scaleDown(item.position[2]) - (scaledItemDepth / 2);

                return (
                  <mesh
                    key={item.id}
                    position={[-offsetX, -offsetY, -offsetZ]}
                    rotation={item.rotation.map(r => r * Math.PI / 180) as [number, number, number]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[scaledItemWidth, scaledItemHeight, scaledItemDepth]} />
                    <meshStandardMaterial 
                      color={item.color} 
                      metalness={0.1}
                      roughness={0.8}
                    />
                  </mesh>
                );
              })}
            </Center>

            <Grid
              args={[10, 10]}
              position={[0, -scaledHeight/2 - 0.01, 0]}
              cellColor="#aaa"
              sectionColor="#555"
              fadeDistance={25}
              fadeStrength={1.5}
            />
            
            <OrbitControls 
              ref={controlsRef}
              enableDamping 
              dampingFactor={0.25} 
              rotateSpeed={0.5}
              minDistance={1}
              maxDistance={10}
            />
            <Environment preset="city" />
          </Canvas>
          
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-white/70 p-1 rounded">
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxVisualization;
