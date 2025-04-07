
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ItemTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Width (cm)</TableHead>
        <TableHead>Height (cm)</TableHead>
        <TableHead>Depth (cm)</TableHead>
        <TableHead>Quantity</TableHead>
        <TableHead>Weight (kg)</TableHead>
        <TableHead>Allow Stacking</TableHead>
        <TableHead>Allow Rotation</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ItemTableHeader;
