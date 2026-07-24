import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: "WELCOME10", type: "Percentage", value: "10%", status: "Active", uses: 45 },
    { id: 2, code: "FREESHIP", type: "Fixed", value: "Free Shipping", status: "Active", uses: 120 },
    { id: 3, code: "SUMMER20", type: "Percentage", value: "20%", status: "Expired", uses: 300 },
  ]);

  const handleAddCoupon = () => {
    toast.info("Feature to add coupon will be connected to backend shortly.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Discounts & Coupons</h1>
        <Button onClick={handleAddCoupon} className="bg-[#C65A28] hover:bg-[#C65A28] text-white">
          <Plus className="h-4 w-4 mr-2" /> New Coupon
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <Input placeholder="Search coupons..." className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-bold">{coupon.code}</TableCell>
                <TableCell>{coupon.type}</TableCell>
                <TableCell>{coupon.value}</TableCell>
                <TableCell>{coupon.uses}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={coupon.status === "Active" ? "bg-[#C65A28]/10 text-[#C65A28] border-[#C65A28]/20" : "bg-muted text-muted-foreground"}>
                    {coupon.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
