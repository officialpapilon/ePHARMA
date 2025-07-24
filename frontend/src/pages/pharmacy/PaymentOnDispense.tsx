import { Check, RotateCw, AlertCircle } from "lucide-react";
import Modal from "../../components/UI/Modal/Modal";

type PaymentState = {
  method: "cash" | "card" | "mobile" | null; 
  amount: string;
  change: number;
};

type PaymentOnDispenseProps = {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentState;
  setPayment: (payment: PaymentState) => void;
  calculateTotal: () => number;
  handlePayment: () => void;
  loading: boolean;
  paymentMethods: {
    id: "cash" | "card" | "mobile";
    name: string;
    icon: React.ReactNode;
    color: string;
  }[];
};

export const PaymentOnDispense = ({
  isOpen,
  onClose,
  payment,
  setPayment,
  calculateTotal,
  handlePayment,
  loading,
  paymentMethods,
}: PaymentOnDispenseProps) => {
  // Check if payment is valid
  const isPaymentValid = () => {
    return (
      payment.method !== null && 
      payment.amount !== "" && 
      parseFloat(payment.amount) >= calculateTotal()
    );
  };

  const customFooter = (
    <div className="flex justify-end space-x-3 w-full">
      <button
        onClick={onClose}
        className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        disabled={loading}
      >
        Cancel
      </button>
      <button
        onClick={handlePayment}
        disabled={loading || !isPaymentValid()}
        className={`px-5 py-2.5 rounded-lg text-white flex items-center transition-colors ${
          loading || !isPaymentValid()
            ? "bg-sky-300 cursor-not-allowed"
            : "bg-sky-600 hover:bg-sky-700 shadow-md"
        }`}
      >
        {loading ? (
          <>
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Complete
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      heading="Complete Payment"
      size="medium"
      showFooter={true}
      customFooter={customFooter}
    >
      <div className="space-y-6">
        <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Grand Total:</span>
            <span className="text-xl font-bold text-sky-600">
              Tsh {calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() =>
                  setPayment({ ...payment, method: method.id })
                }
                className={`p-3 border rounded-lg flex flex-col items-center justify-center transition-all ${
                  payment.method === method.id
                    ? `border-sky-500 ${method.color} ring-2 ring-sky-200`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  {method.icon}
                  {method.name}
                </div>
              </button>
            ))}
          </div>
          {payment.method === null && (
            <div className="mt-2 flex items-center text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Please select a payment method
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Received
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              Tsh
            </span>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
              className="w-full pl-12 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50"
              min={calculateTotal()}
              step="100"
              placeholder="0.00"
            />
          </div>
          {payment.amount === "" ? (
            <div className="mt-2 flex items-center text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Please enter the received amount
            </div>
          ) : parseFloat(payment.amount) < calculateTotal() ? (
            <div className="mt-2 flex items-center text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Received amount must be at least {calculateTotal().toFixed(2)}
            </div>
          ) : null}
        </div>

        {payment.change > 0 && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
            <div className="flex justify-between items-center">
              <span className="bg-green-50 text-green-700">Change To Return:</span>
              <span className="text-lg font-bold">
                Tsh {payment.change.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};