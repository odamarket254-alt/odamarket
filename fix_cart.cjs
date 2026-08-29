const fs = require('fs');
let content = fs.readFileSync('src/pages/CartPage.tsx', 'utf8');

const regex = /export default function CartPage\(\) \{\s*return <div>Test Cart Page<\/div>;\s*\}/;

const replacement = `export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCartStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  const subtotal = getTotal();
  const deliveryFee = deliveryMethod === 'express' ? 250 : 0;
  const total = subtotal + deliveryFee;
  
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userPhone = user?.user_metadata?.phone || "";

  const handleCheckout = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate("/checkout");
  };

  const FREE_DELIVERY_THRESHOLD = 4000;
  const awayFromFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/pages/CartPage.tsx', content);
  console.log("Fixed CartPage.tsx!");
} else {
  console.log("Could not find the target string.");
}
