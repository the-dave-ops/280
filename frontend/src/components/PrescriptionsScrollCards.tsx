import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { prescriptionsApi } from '../api/prescriptions';
import type { Prescription } from '../types';
import { format } from 'date-fns';

interface PrescriptionsScrollCardsProps {
  customerId: number;
  selectedPrescription: Prescription | null;
  onSelect: (prescription: Prescription) => void;
  onAddNew?: () => void;
}

export function PrescriptionsScrollCards({
  customerId,
  selectedPrescription,
  onSelect,
  onAddNew,
}: PrescriptionsScrollCardsProps) {
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
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  // Filter out the selected prescription from the list and sort by date (newest first)
  const otherPrescriptions = prescriptions
    .filter((p) => p.id !== selectedPrescription?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (otherPrescriptions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-3 -mt-4">
          <h3 className="text-sm font-semibold text-gray-700">מרשמים נוספים</h3>
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="מרשם חדש"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          אין מרשמים נוספים
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 -mt-4">
        <h3 className="text-sm font-semibold text-gray-700">מרשמים נוספים</h3>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="מרשם חדש"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {otherPrescriptions.map((prescription) => (
          <button
            key={prescription.id}
            onClick={() => onSelect(prescription)}
            className={`w-full text-right p-1.5 rounded border-2 transition-all hover:shadow-md cursor-pointer ${
              selectedPrescription?.id === prescription.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                    prescription.type
                  )}`}
                >
                  {prescription.type}
                </span>
                <span className="text-gray-500 whitespace-nowrap">
                  {format(new Date(prescription.date), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="flex items-center gap-1 px-1.5 py-0.5 border border-gray-300 rounded" dir="ltr">
                  <span className="text-gray-500 text-xs">R:</span>
                  <span className="font-medium text-xs">{prescription.r || '-'}</span>
                  <span className="text-gray-500 text-xs ml-1">L:</span>
                  <span className="font-medium text-xs">{prescription.l || '-'}</span>
                </div>
                {prescription.add && (
                  <>
                    <span className="text-gray-500 text-xs">ADD:</span>
                    <span className="font-medium text-xs min-w-[30px] text-left">{prescription.add}</span>
                  </>
                )}
                <div className="flex items-center gap-1 px-1.5 py-0.5 border border-gray-300 rounded" dir="ltr">
                  <span className="text-gray-500 text-xs">PD:</span>
                  <span className="font-medium text-xs">{prescription.pd || '-'}</span>
                </div>
              </div>
              {prescription.price && (
                <span className="text-xs font-bold text-primary-600 whitespace-nowrap flex-shrink-0">{prescription.price} ₪</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

