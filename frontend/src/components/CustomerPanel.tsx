import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, Edit2, X, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { customersApi } from '../api/customers';
import { branchesApi } from '../api/branches';
import { prescriptionsApi } from '../api/prescriptions';
import type { Customer } from '../types';
import { format } from 'date-fns';
import { sortedIsraeliCities } from '../utils/israeliCities';
import { formatPhoneNumber, handlePhoneInput, cleanPhoneNumber } from '../utils/phoneFormatting';

const healthFunds = ['מאוחדת', 'מכבי', 'לאומית', 'כללית'];

// Insurance types mapping for each health fund
const insuranceTypesByHealthFund: Record<string, string[]> = {
  'כללית': ['רגיל', 'מושלם', 'מושלם זהב', 'מושלם פלטינום'],
  'מכבי': ['רגיל', 'מכבי שלי', 'מכבי זהב', 'מכבי כסף'],
  'מאוחדת': ['רגיל', 'מאוחדת עדיף', 'עדיף פלטינום'],
  'לאומית': ['רגיל', 'לאומית כסף', 'לאומית זהב', 'לאומית פלטינום'],
};

// Helper function to handle Enter key to move to next field
const handleEnterKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
    );
    const currentIndex = focusableElements.indexOf(e.currentTarget as HTMLElement);
    const nextElement = focusableElements[currentIndex + 1];
    if (nextElement) {
      nextElement.focus();
    }
  }
};

interface CustomerPanelProps {
  customer: Customer;
  onUpdate: (customer: Customer) => void;
  onDuplicate?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  startInEditMode?: boolean;
}

export function CustomerPanel({ customer, onUpdate, onDuplicate, onDelete, onNavigate, startInEditMode }: CustomerPanelProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [formData, setFormData] = useState<Partial<Customer>>(customer);
  const [insuranceType, setInsuranceType] = useState<string>('');
  const queryClient = useQueryClient();

  // Get latest prescription for insurance type
  const latestPrescription = useMemo(() => {
    if (customer.prescriptions && customer.prescriptions.length > 0) {
      return customer.prescriptions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
    }
    return null;
  }, [customer.prescriptions]);

  // Initialize insurance type from latest prescription
  useEffect(() => {
    if (latestPrescription?.insuranceType) {
      setInsuranceType(latestPrescription.insuranceType);
    } else {
      setInsuranceType('רגיל');
    }
  }, [latestPrescription]);

  // Get available insurance types based on selected health fund
  const availableInsuranceTypes = useMemo(() => {
    const healthFund = formData.healthFund || customer.healthFund;
    return healthFund ? insuranceTypesByHealthFund[healthFund] || [] : [];
  }, [formData.healthFund, customer.healthFund]);

  // Update formData when customer prop changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setFormData(customer);
    }
  }, [customer, isEditing]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.update(customer.id, data),
    onSuccess: async (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Update insurance type in latest prescription if it exists and was changed
      if (latestPrescription && insuranceType && insuranceType !== latestPrescription.insuranceType) {
        try {
          await prescriptionsApi.update(latestPrescription.id, { insuranceType });
          queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
        } catch (error) {
          console.error('Failed to update prescription insurance type:', error);
        }
      }
      
      onUpdate(updatedCustomer);
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Failed to update customer:', error);
      alert(`שגיאה בעדכון הלקוח: ${error?.response?.data?.error || error.message || 'שגיאה לא ידועה'}`);
    },
  });

  const handleSave = () => {
    // Clean up formData - remove nested objects (prescriptions, branch) and only send updatable fields
    const cleanData: any = {};
    
    // Only include fields that are actually in the form and have changed
    const fieldsToCheck: (keyof Customer)[] = [
      'firstName', 'lastName', 'idNumber', 'isPassport', 'birthDate',
      'street', 'houseNumber', 'entrance', 'apartment', 'city',
      'phone', 'mobile1', 'mobile2', 'healthFund', 'category', 'branchId'
    ];
    
    fieldsToCheck.forEach((field) => {
      if (formData[field] !== undefined) {
        const value = formData[field];
        
        // Handle birthDate specially - ensure it's a date string in yyyy-MM-dd format
        if (field === 'birthDate') {
          if (value === '' || value === null || value === undefined) {
            cleanData[field] = null;
          } else if (typeof value === 'string') {
            // If it's already a date string (from input type="date"), use it as is
            // Remove time part if present (e.g., "1990-08-20T00:00:00.000Z" -> "1990-08-20")
            cleanData[field] = value.split('T')[0];
          } else if (value instanceof Date) {
            // If it's a Date object, convert to yyyy-MM-dd format
            cleanData[field] = format(value, 'yyyy-MM-dd');
          } else {
            cleanData[field] = value;
          }
        } else {
          // Convert empty strings to null, but keep other values as is
          if (value === '' || value === null) {
            cleanData[field] = null;
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanData[field] = value;
          }
        }
      }
    });
    
    console.log('Sending customer update:', cleanData);
    updateMutation.mutate(cleanData);
  };

  const handleCancel = () => {
    setFormData(customer);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Customer, value: any) => {
    // Clean phone numbers before saving
    if (field === 'phone' || field === 'mobile1' || field === 'mobile2') {
      value = cleanPhoneNumber(value);
    }
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // When health fund changes, reset insurance type to 'רגיל' (default)
      if (field === 'healthFund' && value) {
        setInsuranceType('רגיל');
      }
      
      return newData;
    });
  };

  return (
    <div className="card bg-slate-200/90">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">פרטי לקוח</h2>
          {onNavigate && !isEditing && (
            <div className="flex gap-1">
              <button
                onClick={() => onNavigate('prev')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="לקוח קודם"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="לקוח הבא"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            {onDelete && (
              <button
                onClick={() => onDelete(customer)}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                title="מחק לקוח"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(customer)}
                className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                title="שכפל לקוח"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="ערוך"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50"
              title="שמור"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 text-slate-600 transition-colors"
              title="ביטול"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">שם פרטי</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="rtl"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.firstName || '-'}</div>
            )}
          </div>
          <div>
            <label className="label">שם משפחה</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="rtl"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.lastName || '-'}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">תעודת זהות</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.idNumber || ''}
                onChange={(e) => handleChange('idNumber', e.target.value)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="ltr"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.idNumber || '-'}</div>
            )}
          </div>
          <div>
            <label className="label">תאריך לידה</label>
            {isEditing ? (
              <input
                type="date"
                value={formData.birthDate 
                  ? (typeof formData.birthDate === 'string' 
                      ? formData.birthDate.split('T')[0] 
                      : format(new Date(formData.birthDate), 'yyyy-MM-dd'))
                  : ''}
                onChange={(e) => handleChange('birthDate', e.target.value || null)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="ltr"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {customer.birthDate
                  ? format(new Date(customer.birthDate), 'dd/MM/yyyy')
                  : '-'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">טלפון</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => {
                  const cleaned = handlePhoneInput(e.target.value);
                  handleChange('phone', cleaned);
                }}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="ltr"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{formatPhoneNumber(customer.phone) || '-'}</div>
            )}
          </div>
          <div>
            <label className="label">נייד 1</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.mobile1 || ''}
                onChange={(e) => {
                  const cleaned = handlePhoneInput(e.target.value);
                  handleChange('mobile1', cleaned);
                }}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="ltr"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{formatPhoneNumber(customer.mobile1) || '-'}</div>
            )}
          </div>
        </div>

        <div>
          <label className="label">כתובת</label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="רחוב"
                value={formData.street || ''}
                onChange={(e) => handleChange('street', e.target.value)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="rtl"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="מספר בית"
                  value={formData.houseNumber || ''}
                  onChange={(e) => handleChange('houseNumber', e.target.value)}
                  onKeyDown={handleEnterKeyNavigation}
                  className="input"
                  dir="ltr"
                />
                <input
                  type="text"
                  placeholder="כניסה"
                  value={formData.entrance || ''}
                  onChange={(e) => handleChange('entrance', e.target.value)}
                  onKeyDown={handleEnterKeyNavigation}
                  className="input"
                  dir="ltr"
                />
                <input
                  type="number"
                  placeholder="דירה"
                  value={formData.apartment || ''}
                  onChange={(e) => handleChange('apartment', parseInt(e.target.value) || null)}
                  onKeyDown={handleEnterKeyNavigation}
                  className="input"
                  dir="ltr"
                />
              </div>
              <select
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value || null)}
                onKeyDown={handleEnterKeyNavigation}
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
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg font-bold text-green-800">
              {customer.street && customer.houseNumber
                ? `${customer.street} ${customer.houseNumber}${customer.entrance ? `, ${customer.entrance}` : ''}${customer.apartment ? `, דירה ${customer.apartment}` : ''}${customer.city ? `, ${customer.city}` : ''}`
                : '-'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">קופת חולים</label>
            {isEditing ? (
              <select
                value={formData.healthFund || ''}
                onChange={(e) => handleChange('healthFund', e.target.value || null)}
                onKeyDown={handleEnterKeyNavigation}
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
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.healthFund || '-'}</div>
            )}
          </div>
          <div>
            <label className="label">סוג ביטוח</label>
            {isEditing ? (
              <select
                value={insuranceType}
                onChange={(e) => setInsuranceType(e.target.value)}
                onKeyDown={handleEnterKeyNavigation}
                className="input"
                dir="rtl"
                disabled={!formData.healthFund && !customer.healthFund}
              >
                <option value="">השאר ריק</option>
                {availableInsuranceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {latestPrescription?.insuranceType || '-'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">סניף</label>
            {isEditing ? (
              <BranchSelect
                value={formData.branchId || null}
                onChange={(branchId) => handleChange('branchId', branchId)}
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {customer.branch?.name || '-'}
              </div>
            )}
          </div>
        </div>
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
      onKeyDown={handleEnterKeyNavigation}
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

