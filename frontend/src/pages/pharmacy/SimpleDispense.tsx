import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  CreditCard,
  ShoppingCart,
  Scan,
} from "lucide-react";
import { API_BASE_URL } from "../../../constants";
import type { Column } from "../../lib/types";
import Table from "../../components/UI/Table/Table";
import { useSettings } from "../../contexts/SettingsContext";
import { NavigateNext } from "@mui/icons-material";
import BarcodeScanner from "../../components/Scanners/BarCodeScanner";
import Pagination from "../../components/UI/Pagination/Pagination";
import { PaymentOnDispense } from "./PaymentOnDispense";
import SuccessModal from "../../components/UI/Modal/SuccessModal";
import { Transition } from "react-transition-group";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "@mui/material";

// Define types
interface CartItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  stock: number;
}
interface Medicine {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  current_quantity: number;
  product_category: string;
}
interface PaymentState {
  method: string;
  amount: string;
  change: number;
}

const SimpleDispensing: React.FC = () => {
  const [medicineSearchTerm, setMedicineSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMedicationTray, setShowMedicationTray] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { settings } = useSettings();

  const user = useAuth();

  const [payment, setPayment] = useState<PaymentState>({
    method: "cash",
    amount: "",
    change: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.quantity * item.price, 0);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/medicines-cache?limit=15&page=${pagination.currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();
        const formattedData = data.data.map((m: any) => ({
          id: String(m.id),
          product_id: String(m.product_id),
          product_name: m.product_name || "Unknown",
          product_price: parseFloat(m.product_price) || 0,
          current_quantity: parseInt(m.current_quantity, 10) || 0,
          product_category: m.product_category || "Unknown",
        }));

        setMedicines(formattedData);
        setPagination({
          currentPage: data.current_page,
          perPage: data.per_page,
          totalPages: data.last_page,
          totalItems: data.total,
        });
      } catch (err) {
        setError("Oops! Something went wrong while fetching medicines.");
        console.error("Error fetching medicines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [pagination.currentPage]);

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.product_name
      .toLowerCase()
      .includes(medicineSearchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine, quantity: number = 1) => {
    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (quantity > medicine.current_quantity) {
      setError(
        `Cannot add more than available stock (${medicine.current_quantity})`
      );
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.medicineId === medicine.product_id
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > medicine.current_quantity) {
          setError(
            `Total quantity exceeds available stock (${medicine.current_quantity})`
          );
          return prevCart;
        }

        return prevCart.map((item) =>
          item.medicineId === medicine.product_id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      const newCart = [
        ...prevCart,
        {
          id: Date.now().toString(),
          medicineId: medicine.product_id,
          medicineName: medicine.product_name,
          quantity,
          price: medicine.product_price,
          stock: medicine.current_quantity,
        },
      ];

      setShowMedicationTray(true);

      return newCart;
    });
  };

  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id && newQuantity > item.stock) {
          setError(`Cannot exceed available stock (${item.stock})`);
          return item;
        }
        return item.id === id ? { ...item, quantity: newQuantity } : item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== id);
      if (newCart.length === 0) {
        setShowMedicationTray(false);
      }
      return newCart;
    });
  };



  const handlePayment = async () => {
    if (cart.length === 0) {
      setError("Please add items to cart before payment");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const currentUserId = user?.user?.id;
      if (!currentUserId) {
        setError("User not loaded. Please re-login.");
        setLoading(false);
        return;
      }

      const cartPayload = {
        product_purchased: cart.map((item) => ({
          product_id: item.medicineId,
          product_quantity: item.quantity,
          product_price: item.price,
        })),
        payment_method: payment.method,
        total_price: calculateTotal(),
        amount_received: parseFloat(payment.amount) || 0,
      };

      const cartResponse = await fetch(
        `${API_BASE_URL}/api/carts?isSimple=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(cartPayload),
        }
      );

      const cartData = await cartResponse.json();

      if (!cartResponse.ok) {
        throw new Error(cartData.message || "Failed to create cart");
      }

      const approvalPromises = cartData.data.product_purchased.map(
        async (product: any) => {
          const approvalPayload = {
            Patient_ID: cartData.data.patient_ID,
            Product_ID: product.product_id,
            transaction_ID: cartData.data.transaction_ID,
            status: "Approved",
            approved_by: String(currentUserId),
            approved_at: new Date().toISOString(),
            approved_quantity: product.product_quantity,
            approved_amount: product.product_price * product.product_quantity,
            approved_payment_method: payment.method,
          };
          console.log('Approval payload:', approvalPayload);
          const approveResponse = await fetch(
            `${API_BASE_URL}/api/payment-approve`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              body: JSON.stringify(approvalPayload),
            }
          );

          if (!approveResponse.ok) {
            const errorData = await approveResponse.json();
            throw new Error(
              errorData.message ||
                `Failed to approve payment for product ${product.product_id}`
            );
          }

          const dispensePayload = {
            quantity: product.product_quantity,
            Payment_ID: cartData.data.transaction_ID.toString(),
            Patient_ID: cartData.data.patient_ID,
            created_by: String(currentUserId),
            transaction_id: String(cartData.data.transaction_ID),
            transaction_status: "completed",
            total_price: product.product_price * product.product_quantity,
            payment_method: payment.method,
            approved_payment_method: payment.method,
          };

          const dispenseResponse = await fetch(
            `${API_BASE_URL}/api/dispense/${product.product_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              body: JSON.stringify(dispensePayload),
            }
          );

          if (!dispenseResponse.ok) {
            const errorData = await dispenseResponse.json();
            throw new Error(
              errorData.message ||
                `Failed to dispense product ${product.product_id}`
            );
          }

          return {
            approval: await approveResponse.json(),
            dispense: await dispenseResponse.json(),
          };
        }
      );

      await Promise.all(approvalPromises);

      setCart([]);
      setShowPaymentModal(false);
      setShowMedicationTray(false);
      setShowSuccessModal(true);
      setError("");
    } catch (err) {
      setError("Oops! Something went wrong while processing payment.");
      console.error("Payment processing error:", err);
    } finally {
      setLoading(false);
    }
  };
  const resetTransaction = () => {
    setCart([]);
    setShowSuccessModal(false);
    setShowMedicationTray(false);
    setPayment({ method: "cash", amount: "", change: 0 });
  };

  useEffect(() => {
    const amount = parseFloat(payment.amount) || 0;
    const change = amount - calculateTotal();
    setPayment((prev) => ({ ...prev, change: change > 0 ? change : 0 }));
  }, [payment.amount, cart]);

  const columns: Column[] = [
    {
      key: "product_name",
      header: "Medicine Name",
    },
    {
      key: "product_category",
      header: "Category",
    },
    {
      key: "product_price",
      header: "Price (Tsh)",
      render: (row: Medicine) => row.product_price.toFixed(2),
    },
    {
      key: "current_quantity",
      header: "Stock",
      render: (row: Medicine) => (
        <span
          className={row.current_quantity > 0 ? "text-black" : "text-red-600"}
        >
          {row.current_quantity > 0
            ? `${row.current_quantity}`
            : "Out of stock"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Medicine) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const existing = cart.find(
                  (item) => item.medicineId === row.product_id
                );
                if (existing) {
                  updateCartItemQuantity(existing.id, existing.quantity - 1);
                }
              }}
              disabled={
                !cart.find((item) => item.medicineId === row.product_id) ||
                cart.find((item) => item.medicineId === row.product_id)
                  ?.quantity <= 1
              }
              className="px-2 py-1 bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              -
            </button>
            <span className="px-2 py-1 text-sm">
              {cart.find((item) => item.medicineId === row.product_id)
                ?.quantity || 0}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(row, 1);
              }}
              disabled={row.current_quantity <= 0}
              className="px-2 py-1 bg-gray-100 text-gray-600 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(row, 1);
              setShowMedicationTray(true);
            }}
            disabled={row.current_quantity <= 0}
            className={`px-3 py-1 rounded-lg text-sm flex items-center ${
              row.current_quantity <= 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-yellow-600 text-white hover:bg-indigo-200 hover:text-black"
            }`}
          >
            <Plus size={14} className="mr-1" /> Dispense
          </button>
        </div>
      ),
    },
  ];

  const transitionStyles = {
    entering: { opacity: 0, transform: "translateX(100%)" },
    entered: { opacity: 1, transform: "translateX(0)" },
    exiting: { opacity: 0, transform: "translateX(100%)" },
    exited: { opacity: 0, transform: "translateX(100%)" },
  };

  const theme = useTheme();

  return (
    <main style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: theme.palette.background.default, boxSizing: 'border-box', padding: '16px' }}>
      <header className="bg-white shadow-sm">
        <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center mb-4">
            <NavigateNext className="h-6 w-6 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-600">Pharmacy</h4>
            <NavigateNext className="h-6 w-6 text-gray-500" />
            <h1 className="text-sm font-semibold text-gray-600">Dispense</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                className="p-2 rounded-full bg-indigo-100 text-indigo-600 relative"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex justify-between items-center">
            <div>
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div
          className={`grid ${
            showMedicationTray ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
          } gap-6`}
        >
          <div
            className={`${showMedicationTray ? "lg:col-span-2" : ""} space-y-6`}
          >
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="filter medicines by name or Barcode..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={medicineSearchTerm}
                  onChange={(e) => setMedicineSearchTerm(e.target.value)}
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setShowScanner(true)}
                    className="p-1 rounded-md bg-indigo-100 text-indigo-600"
                  >
                    <Scan className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table
                loading={loading}
                columns={columns}
                data={filteredMedicines}
              />
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  perPage={pagination.perPage}
                  totalItems={pagination.totalItems}
                  onPageChange={(page) => {
                    setPagination((prev) => ({ ...prev, currentPage: page }));
                  }}
                />
              </div>
            </div>
          </div>

          <Transition in={showMedicationTray} timeout={300} unmountOnExit>
            {(state) => (
              <div
                className="lg:col-span-1 transition-all duration-300 ease-in-out"
                style={{
                  ...transitionStyles[state],
                }}
              >
                <div className="bg-white rounded-xl shadow-sm sticky top-6 overflow-hidden">
                  <div className="p-4 bg-sky-600 text-white">
                    <h2 className="text-lg font-semibold flex items-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Medication Tray
                    </h2>
                  </div>

                  {cart.length > 0 ? (
                    <>
                      <div className="max-h-[650px] overflow-y-auto">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border-b border-gray-100"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-800">
                                  {item.medicineName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Tsh {item.price.toFixed(2)} each
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() =>
                                    updateCartItemQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="px-2 py-1 text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartItemQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  disabled={item.quantity >= item.stock}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>

                              <p className="font-medium">
                                Tsh {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 border-t border-gray-100">
                        <div className="space-y-3">
                          <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total:</span>
                            <span className="font-bold text-indigo-600">
                              Tsh {calculateTotal().toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full bg-indigo-900 hover:bg-teal-300 text-white hover:text-black py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md"
                          >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Process Payment
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <ShoppingCart className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-gray-600">
                        Medication Tray is Empty..!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Transition>
        </div>
      </main>

      <PaymentOnDispense
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={payment}
        setPayment={setPayment}
        calculateTotal={calculateTotal}
        handlePayment={handlePayment}
        loading={loading}
        paymentMethods={settings?.payment_options || []}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={resetTransaction}
        title="Payment Successful!"
        message="Your transaction has been processed successfully"
        variant="success"
        showTotal={true}
        totalAmount={calculateTotal()}
        showPaymentInfo={true}
        payment={{
          amount: payment.amount,
          change: payment.change,
        }}
        primaryButtonText="Done"
        size="md"
        animation="slide"
      />

      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            setMedicineSearchTerm(barcode);
            const matches = medicines.filter(
              (m) =>
                m.product_id === barcode ||
                m.product_name.toLowerCase().includes(barcode.toLowerCase())
            );
            if (matches.length === 1) {
              addToCart(matches[0]);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </main>
  );
};

export default SimpleDispensing;
