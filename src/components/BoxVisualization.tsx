
import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Center, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import { BoxDimensions, PackedItem } from "@/types";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ZoomIn, ZoomOut, RotateCcw, ClipboardList, Check } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BoxVisualizationProps {
  boxDimensions: BoxDimensions;
  packedItems: PackedItem[];
  utilizationPercentage: number;
  packingInstructions?: string[];
}

const BoxVisualization = ({
  boxDimensions,
  packedItems,
  utilizationPercentage,
  packingInstructions = [],
}: BoxVisualizationProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([4, 4, 4]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);

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
      setCameraPosition([4, 4, 4]);
      toast.success("Camera view reset");
    }
  };

  const zoomIn = () => {
    setCameraPosition(prev => [prev[0] * 0.8, prev[1] * 0.8, prev[2] * 0.8]);
  };

  const zoomOut = () => {
    setCameraPosition(prev => [prev[0] * 1.2, prev[1] * 1.2, prev[2] * 1.2]);
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  const copyInstructions = () => {
    if (packingInstructions.length === 0) return;
    
    const text = packingInstructions.join('\n');
    navigator.clipboard.writeText(text)
      .then(() => {
        setInstructionsCopied(true);
        toast.success("Instructions copied to clipboard");
        setTimeout(() => setInstructionsCopied(false), 2000);
      })
      .catch(err => {
        toast.error("Failed to copy instructions");
        console.error("Error copying text: ", err);
      });
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
            <Button 
              onClick={toggleInstructions} 
              variant={showInstructions ? "default" : "outline"} 
              size="sm" 
              title="Packing Instructions"
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              Instructions
            </Button>
            <Button onClick={zoomOut} variant="outline" size="sm" title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={zoomIn} variant="outline" size="sm" title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
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
        {showInstructions ? (
          <div className="w-full h-full p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Packing Instructions</h3>
              <Button 
                onClick={copyInstructions} 
                variant="outline" 
                size="sm" 
                disabled={packingInstructions.length === 0 || instructionsCopied}
              >
                {instructionsCopied ? (
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-1" />
                )}
                {instructionsCopied ? "Copied!" : "Copy All"}
              </Button>
            </div>
            
            {packingInstructions.length === 0 ? (
              <p className="text-muted-foreground italic">No packing instructions available.</p>
            ) : (
              <ScrollArea className="h-[calc(100%-40px)]">
                <ol className="space-y-2 list-decimal list-inside pl-2">
                  {packingInstructions.map((instruction, index) => (
                    <li key={index} className="text-sm">{instruction.substring(instruction.indexOf('.') + 1).trim()}</li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div ref={canvasRef} className="w-full h-full min-h-[400px]">
            <Canvas 
              shadows
              gl={{ preserveDrawingBuffer: true }}
            >
              <PerspectiveCamera 
                makeDefault 
                position={cameraPosition} 
                fov={50}
              />
              <color attach="background" args={["#f8fafc"]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
              
              {/* Center everything */}
              <Center>
                {/* Box container base (floor) */}
                <mesh 
                  position={[0, -scaledHeight/2, 0]} 
                  receiveShadow
                >
                  <boxGeometry args={[scaledWidth, 0.02, scaledDepth]} />
                  <meshStandardMaterial color="#a0aec0" roughness={0.8} />
                </mesh>
                
                {/* Box container walls */}
                <mesh position={[0, 0, 0]} receiveShadow>
                  <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
                  <meshStandardMaterial wireframe={true} color="#475569" opacity={0.3} transparent />
                </mesh>
                
                {/* Packed items */}
                {packedItems.map((item) => {
                  const scaledItemWidth = scaleDown(item.width);
                  const scaledItemHeight = scaleDown(item.height);
                  const scaledItemDepth = scaleDown(item.depth);
                  
                  // Calculate position - critically important for proper placement
                  // The origin (0,0,0) is the center of the box
                  // We need to transform item coordinates to be relative to the center
                  
                  const halfBoxWidth = scaledWidth / 2;
                  const halfBoxHeight = scaledHeight / 2;
                  const halfBoxDepth = scaledDepth / 2;
                  
                  // Transform from corner-origin to center-origin coordinate system
                  // Start by scaling down the positions
                  const scaledPosX = scaleDown(item.position[0]);
                  const scaledPosY = scaleDown(item.position[1]);
                  const scaledPosZ = scaleDown(item.position[2]);
                  
                  // Then shift so (0,0,0) is box center instead of corner
                  const posX = scaledPosX - halfBoxWidth;
                  const posY = scaledPosY - halfBoxHeight;
                  const posZ = scaledPosZ - halfBoxDepth;

                  return (
                    <mesh
                      key={item.id}
                      position={[posX, posY, posZ]}
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
                minDistance={2}
                maxDistance={15}
                target={[0, 0, 0]}
              />
              <Environment preset="city" />
            </Canvas>
            
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-white/70 p-1 rounded">
              Drag to rotate • Scroll to zoom • Double-click to reset view
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoxVisualization;
