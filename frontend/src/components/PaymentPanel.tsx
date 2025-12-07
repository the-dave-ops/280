import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '../api/prescriptions';
import type { Customer } from '../types';

interface PaymentPanelProps {
  customer: Customer;
}

export function PaymentPanel({ customer }: PaymentPanelProps) {
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['prescriptions', 'customer', customer.id],
    queryFn: () => prescriptionsApi.getAll({ customerId: customer.id }),
  });

  const totalAmountToPay = prescriptions.reduce(
    (sum, p) => sum + (p.amountToPay || 0),
    0
  );
  const totalPaid = prescriptions.reduce((sum, p) => sum + (p.paid || 0), 0);
  const totalBalance = totalAmountToPay - totalPaid;

  return (
    <div className="card">
      <h2 className="text-base font-bold mb-1.5 -mt-4">סיכום תשלומים</h2>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 bg-blue-50 rounded-lg">
          <div className="text-[10px] text-gray-600 mb-0.5">סה"כ לתשלום</div>
          <div className="text-xs font-bold text-blue-700">{Math.round(totalAmountToPay).toLocaleString('he-IL')} ₪</div>
        </div>
        <div className="text-center p-1.5 bg-green-50 rounded-lg">
          <div className="text-[10px] text-gray-600 mb-0.5">סה"כ שולם</div>
          <div className="text-xs font-bold text-green-700">{Math.round(totalPaid).toLocaleString('he-IL')} ₪</div>
        </div>
        <div className="text-center p-1.5 bg-red-50 rounded-lg">
          <div className="text-[10px] text-gray-600 mb-0.5">יתרה</div>
          <div className="text-xs font-bold text-red-700">{Math.round(totalBalance).toLocaleString('he-IL')} ₪</div>
        </div>
      </div>
    </div>
  );
}

