
import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Center, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import { BoxDimensions, PackedItem } from "@/types";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ZoomIn, ZoomOut, RotateCcw, ClipboardList, Check, Printer, Package, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const instructionsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([4, 4, 4]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);
  const [instructionView, setInstructionView] = useState<"list" | "visual">("list");
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

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

  const printInstructions = () => {
    if (!instructionsRef.current) return;
    
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      const boxInfo = `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 24px; margin-bottom: 10px;">Packing Instructions</h2>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
              <h3 style="font-size: 16px; margin-top: 0;">Box Dimensions</h3>
              <p>Width: ${boxDimensions.width} cm</p>
              <p>Height: ${boxDimensions.height} cm</p>
              <p>Depth: ${boxDimensions.depth} cm</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
              <h3 style="font-size: 16px; margin-top: 0;">Packing Summary</h3>
              <p>Total Items: ${packedItems.length}</p>
              <p>Space Utilization: ${utilizationPercentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      `;
      
      const instructionsContent = instructionsRef.current.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Packing Instructions</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .instruction-item { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
              .instruction-number { font-weight: bold; display: inline-block; width: 30px; }
              .instruction-content { display: flex; align-items: center; }
              .item-name { font-weight: bold; color: #2563eb; }
              .item-position { display: inline-block; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin: 0 4px; }
              .item-rotation { font-style: italic; color: #64748b; }
              img { max-width: 100%; height: auto; margin: 20px 0; }
              @media print {
                .no-break { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${boxInfo}
            ${instructionsContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast.error("Unable to open print window");
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

  const highlightItemInVisualization = (itemId: string | null) => {
    setHighlightedItem(itemId);
  };

  // Extract item instruction number from the string
  const getItemNumberFromInstruction = (instruction: string): number => {
    const match = instruction.match(/^(\d+)\./);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Extract item id from instruction based on its position in the array (assuming order is maintained)
  const getItemIdFromInstruction = (instructionIndex: number): string | null => {
    if (instructionIndex < 0 || instructionIndex >= packedItems.length) return null;
    return packedItems[instructionIndex].id;
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
          <div className="w-full h-full p-4 bg-white" ref={instructionsRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Packing Instructions</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={printInstructions} 
                  variant="outline" 
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
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
            </div>
            
            <ToggleGroup 
              type="single" 
              value={instructionView}
              onValueChange={(value) => value && setInstructionView(value as "list" | "visual")}
              className="mb-4"
            >
              <ToggleGroupItem value="list">Detailed List</ToggleGroupItem>
              <ToggleGroupItem value="visual">Visual Guide</ToggleGroupItem>
            </ToggleGroup>
            
            {packingInstructions.length === 0 ? (
              <p className="text-muted-foreground italic">No packing instructions available.</p>
            ) : (
              <ScrollArea className="h-[calc(100%-90px)]">
                {instructionView === "list" ? (
                  <div className="space-y-3">
                    {packingInstructions.map((instruction, index) => {
                      const itemId = getItemIdFromInstruction(index);
                      const instructionParts = instruction.split('.');
                      const instructionNum = instructionParts[0];
                      const instructionText = instructionParts.slice(1).join('.').trim();
                      
                      // Extract position from the instruction using regex
                      const positionMatch = instructionText.match(/position \(([\d.]+)cm, ([\d.]+)cm, ([\d.]+)cm\)/);
                      const positionText = positionMatch ? `(${positionMatch[1]}, ${positionMatch[2]}, ${positionMatch[3]})` : "";
                      
                      // Extract item name
                      const itemNameMatch = instructionText.match(/Place ([^(]+) at/);
                      const itemName = itemNameMatch ? itemNameMatch[1].trim() : "Item";
                      
                      // Extract rotation info
                      const rotationMatch = instructionText.match(/rotated (.+)\.$/);
                      const rotationText = rotationMatch ? rotationMatch[1] : "";
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-md no-break ${
                            itemId === highlightedItem ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                          }`}
                          onMouseEnter={() => highlightItemInVisualization(itemId)}
                          onMouseLeave={() => highlightItemInVisualization(null)}
                        >
                          <div className="flex items-start">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium mr-3 shrink-0">
                              {instructionNum}
                            </span>
                            <div>
                              <p className="mb-2">
                                Place <span className="font-medium text-primary">{itemName}</span> at position 
                                <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded mx-1.5 font-mono text-sm">
                                  {positionText}
                                </span>
                              </p>
                              
                              {rotationText && (
                                <p className="text-sm text-muted-foreground italic">
                                  <span className="font-medium">Rotation:</span> {rotationText}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {packedItems.map((item, index) => {
                      const instructionIndex = index;
                      const instruction = packingInstructions[instructionIndex] || '';
                      
                      return (
                        <div 
                          key={item.id}
                          className={`border rounded-md overflow-hidden ${
                            item.id === highlightedItem ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                          }`}
                          onMouseEnter={() => highlightItemInVisualization(item.id)}
                          onMouseLeave={() => highlightItemInVisualization(null)}
                        >
                          <div className="p-3 flex items-center border-b bg-gray-50">
                            <Package className="h-5 w-5 text-primary mr-2" />
                            <span className="font-medium">{item.name}</span>
                            <span className="ml-auto text-sm text-muted-foreground">Step {instructionIndex + 1}</span>
                          </div>
                          <div className="p-3">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-gray-100 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Width</div>
                                <div className="font-medium">{item.width} cm</div>
                              </div>
                              <div className="bg-gray-100 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Height</div>
                                <div className="font-medium">{item.height} cm</div>
                              </div>
                              <div className="bg-gray-100 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Depth</div>
                                <div className="font-medium">{item.depth} cm</div>
                              </div>
                            </div>
                            <div className="text-sm">
                              <div className="mb-1"><span className="font-medium">Position:</span> ({Math.round(item.position[0])}cm, {Math.round(item.position[1])}cm, {Math.round(item.position[2])}cm)</div>
                              {(item.rotation[0] !== 0 || item.rotation[1] !== 0 || item.rotation[2] !== 0) && (
                                <div className="text-sm text-muted-foreground italic">
                                  <span className="font-medium">Rotation:</span> {item.rotation.map((r, i) => r !== 0 ? `${r}° ${i === 0 ? 'X' : i === 1 ? 'Y' : 'Z'}` : null).filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

                  // Check if this item is highlighted
                  const isHighlighted = item.id === highlightedItem;

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
                        color={isHighlighted ? "#3b82f6" : item.color} 
                        metalness={0.1}
                        roughness={0.8}
                        emissive={isHighlighted ? "#60a5fa" : "#000000"}
                        emissiveIntensity={isHighlighted ? 0.5 : 0}
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
