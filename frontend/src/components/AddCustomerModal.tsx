import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { customersApi } from '../api/customers';
import { branchesApi } from '../api/branches';
import type { Customer } from '../types';
import { sortedIsraeliCities } from '../utils/israeliCities';
import { handlePhoneInput, cleanPhoneNumber } from '../utils/phoneFormatting';

const healthFunds = ['מאוחדת', 'מכבי', 'לאומית', 'כללית'];

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    isPassport: false,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.create(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess(customer);
      onClose();
      // Reset form
      setFormData({ isPassport: false });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clean up formData - convert empty strings to null, keep other values
    const cleanData: any = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof typeof formData];
      if (value !== undefined) {
        // Clean phone numbers
        if (key === 'phone' || key === 'mobile1' || key === 'mobile2') {
          cleanData[key] = cleanPhoneNumber(value as string);
        } else if (value === '' || value === null) {
          cleanData[key] = null;
        } else {
          cleanData[key] = value;
        }
      }
    });
    console.log('Sending customer create:', cleanData);
    createMutation.mutate(cleanData);
  };

  const handleChange = (field: keyof Customer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">הוסף לקוח חדש</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">שם פרטי *</label>
              <input
                type="text"
                required
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="input"
                dir="rtl"
              />
            </div>
            <div>
              <label className="label">שם משפחה *</label>
              <input
                type="text"
                required
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="input"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">תעודת זהות *</label>
              <input
                type="text"
                required
                value={formData.idNumber || ''}
                onChange={(e) => handleChange('idNumber', e.target.value)}
                className="input"
                dir="ltr"
                placeholder="9 ספרות"
              />
            </div>
            <div>
              <label className="label">תאריך לידה</label>
              <input
                type="date"
                value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPassport"
              checked={formData.isPassport || false}
              onChange={(e) => handleChange('isPassport', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isPassport" className="text-sm text-gray-700">
              זהו מספר דרכון (לא תעודת זהות)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">טלפון</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => {
                  const cleaned = handlePhoneInput(e.target.value);
                  handleChange('phone', cleaned);
                }}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">נייד 1</label>
              <input
                type="tel"
                value={formData.mobile1 || ''}
                onChange={(e) => {
                  const cleaned = handlePhoneInput(e.target.value);
                  handleChange('mobile1', cleaned);
                }}
                className="input"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="label">רחוב</label>
            <input
              type="text"
              value={formData.street || ''}
              onChange={(e) => handleChange('street', e.target.value)}
              className="input"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="label">מספר בית</label>
              <input
                type="text"
                value={formData.houseNumber || ''}
                onChange={(e) => handleChange('houseNumber', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">כניסה</label>
              <input
                type="text"
                value={formData.entrance || ''}
                onChange={(e) => handleChange('entrance', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">דירה</label>
              <input
                type="number"
                value={formData.apartment || ''}
                onChange={(e) => handleChange('apartment', parseInt(e.target.value) || null)}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">עיר</label>
              <select
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value || null)}
                className="input"
                dir="rtl"
              >
                <option value="">השאר ריק</option>
                {sortedIsraeliCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">קופת חולים</label>
              <select
                value={formData.healthFund || ''}
                onChange={(e) => handleChange('healthFund', e.target.value || null)}
                className="input"
                dir="rtl"
              >
                <option value="">השאר ריק</option>
                {healthFunds.map((fund) => (
                  <option key={fund} value={fund}>
                    {fund}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">קטגוריה</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="input"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="label">סניף</label>
            <BranchSelect
              value={formData.branchId || null}
              onChange={(branchId) => handleChange('branchId', branchId)}
            />
          </div>

          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {createMutation.error instanceof Error && 'response' in createMutation.error
                ? (createMutation.error as any).response?.data?.error || 'שגיאה ביצירת לקוח. נסה שוב.'
                : 'שגיאה ביצירת לקוח. נסה שוב.'}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'שומר...' : 'שמור לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface BranchSelectProps {
  value: number | null;
  onChange: (branchId: number | null) => void;
}

function BranchSelect({ value, onChange }: BranchSelectProps) {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  if (isLoading) {
    return <div className="input">טוען...</div>;
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
      className="input"
      dir="rtl"
    >
      <option value="">בחר סניף</option>
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>
  );
}

