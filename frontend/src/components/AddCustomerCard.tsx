import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import { customersApi } from '../api/customers';
import { branchesApi } from '../api/branches';
import type { Customer } from '../types';
import { sortedIsraeliCities } from '../utils/israeliCities';
import { handlePhoneInput, cleanPhoneNumber } from '../utils/phoneFormatting';

const healthFunds = ['מאוחדת', 'מכבי', 'לאומית', 'כללית'];

interface AddCustomerCardProps {
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export function AddCustomerCard({ onSuccess, onCancel }: AddCustomerCardProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    isPassport: false,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.create(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess(customer);
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

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg p-6 border border-slate-200" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">פרטי לקוח</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-600 hover:text-slate-800"
          title="חזור"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">שם פרטי</label>
            <input
              type="text"
              required
              value={formData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="rtl"
              placeholder="ישראל"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">שם משפחה</label>
            <input
              type="text"
              required
              value={formData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="rtl"
              placeholder="ישראלי"
            />
          </div>
        </div>

        {/* ID and Birth Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">תעודת זהות</label>
            <input
              type="text"
              required
              value={formData.idNumber || ''}
              onChange={(e) => handleChange('idNumber', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="012345678"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">תאריך לידה</label>
            <input
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => handleChange('birthDate', e.target.value || null)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
            />
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">טלפון</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', handlePhoneInput(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="-"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">נייד 1</label>
            <input
              type="tel"
              value={formData.mobile1 || ''}
              onChange={(e) => handleChange('mobile1', handlePhoneInput(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="-"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">נייד 2</label>
            <input
              type="tel"
              value={formData.mobile2 || ''}
              onChange={(e) => handleChange('mobile2', handlePhoneInput(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="-"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">כתובת</label>
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            dir="rtl"
            placeholder="-"
          />
        </div>

        {/* Street Number and Apartment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">מספר בית</label>
            <input
              type="number"
              value={formData.streetNumber || ''}
              onChange={(e) => handleChange('streetNumber', parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="-"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">דירה</label>
            <input
              type="number"
              value={formData.apartment || ''}
              onChange={(e) => handleChange('apartment', parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="ltr"
              placeholder="-"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">עיר</label>
          <select
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value || null)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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

        {/* Health Fund and Insurance Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">קופת חולים</label>
            <select
              value={formData.healthFund || ''}
              onChange={(e) => handleChange('healthFund', e.target.value || null)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            <label className="block text-xs text-slate-600 mb-1">סוג ביטוח</label>
            <input
              type="text"
              value={formData.insuranceType || ''}
              onChange={(e) => handleChange('insuranceType', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="rtl"
              placeholder="מאוחדת עדיף"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">סניף</label>
          {branchesLoading ? (
            <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-base text-slate-400">
              טוען...
            </div>
          ) : (
            <select
              value={formData.branchId || ''}
              onChange={(e) => handleChange('branchId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              dir="rtl"
            >
              <option value="">בחר סניף</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {createMutation.error instanceof Error && 'response' in createMutation.error
              ? (createMutation.error as any).response?.data?.error || 'שגיאה ביצירת לקוח. נסה שוב.'
              : 'שגיאה ביצירת לקוח. נסה שוב.'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {createMutation.isPending ? 'שומר...' : 'שמור לקוח'}
          </button>
        </div>
      </form>
    </div>
  );
}
