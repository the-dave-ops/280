import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { prescriptionsApi } from '../api/prescriptions';
import type { Prescription } from '../types';
import { format } from 'date-fns';

interface PrescriptionsCardsProps {
  customerId: number;
  selectedPrescription: Prescription | null;
  onSelect: (prescription: Prescription) => void;
  onAddNew: () => void;
}

export function PrescriptionsCards({
  customerId,
  selectedPrescription,
  onSelect,
  onAddNew,
}: PrescriptionsCardsProps) {
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', 'customer', customerId],
    queryFn: () => prescriptionsApi.getAll({ customerId }),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'מרחק':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'קריאה':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'עדשות מגע':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'מולטיפוקל':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">מרשמים</h2>
        <button onClick={onAddNew} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 ml-1" />
          מרשם חדש
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          אין מרשמים עבור לקוח זה
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((prescription) => (
            <button
              key={prescription.id}
              onClick={() => onSelect(prescription)}
              className={`text-right p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedPrescription?.id === prescription.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(
                    prescription.type
                  )}`}
                >
                  {prescription.type}
                </span>
                <span className="text-sm text-gray-500">
                  {format(new Date(prescription.date), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">R:</span>
                  <span className="font-medium">{prescription.r || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">L:</span>
                  <span className="font-medium">{prescription.l || '-'}</span>
                </div>
                {prescription.pd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PD:</span>
                    <span className="font-medium">{prescription.pd}</span>
                  </div>
                )}
                {prescription.price && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-500">מחיר:</span>
                    <span className="font-bold text-primary-600">{prescription.price} ₪</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

