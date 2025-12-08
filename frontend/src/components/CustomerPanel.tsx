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
  onNavigateToCustomer?: (customerId: number) => void;
  startInEditMode?: boolean;
}

export function CustomerPanel({ customer, onUpdate, onDuplicate, onDelete, onNavigate, onNavigateToCustomer, startInEditMode }: CustomerPanelProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [formData, setFormData] = useState<Partial<Customer>>(customer);
  const [insuranceType, setInsuranceType] = useState<string>('');
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  // Get all customers for related customers dropdown
  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => customersApi.getAll({ limit: 1000 }),
    enabled: isEditing,
  });

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

  // Initialize selected related IDs when entering edit mode
  useEffect(() => {
    if (isEditing && customer.relatedTo) {
      setSelectedRelatedIds(customer.relatedTo.map(r => r.id));
    }
  }, [isEditing, customer.relatedTo]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allCustomers
      .filter(c => c.id !== customer.id && !selectedRelatedIds.includes(c.id))
      .filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const phone = c.phone?.toLowerCase() || '';
        const mobile1 = c.mobile1?.toLowerCase() || '';
        const idNumber = c.idNumber?.toLowerCase() || '';
        
        return fullName.includes(query) || 
               phone.includes(query) || 
               mobile1.includes(query) ||
               idNumber.includes(query);
      })
      .slice(0, 10); // Limit to 10 results
  }, [searchQuery, allCustomers, customer.id, selectedRelatedIds]);

  // Add related customer
  const handleAddRelated = (customerId: number) => {
    if (!selectedRelatedIds.includes(customerId)) {
      setSelectedRelatedIds([...selectedRelatedIds, customerId]);
      setSearchQuery('');
    }
  };

  // Remove related customer
  const handleRemoveRelated = (customerId: number) => {
    setSelectedRelatedIds(selectedRelatedIds.filter(id => id !== customerId));
  };

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
    
    // Add related customer IDs if they were selected
    if (selectedRelatedIds.length > 0) {
      cleanData.relatedCustomerIds = selectedRelatedIds;
    }
    
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
    <div className="card bg-slate-200/90 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-slate-800">פרטי לקוח</h2>
          {onNavigate && !isEditing && (
            <div className="flex gap-0.5">
              <button
                onClick={() => onNavigate('prev')}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="לקוח קודם"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="לקוח הבא"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {!isEditing ? (
          <div className="flex gap-1">
            {onDelete && (
              <button
                onClick={() => onDelete(customer)}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                title="מחק לקוח"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(customer)}
                className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                title="שכפל לקוח"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="ערוך"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50"
              title="שמור"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 text-slate-600 transition-colors"
              title="ביטול"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.firstName || '-'}</div>
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.lastName || '-'}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.idNumber || '-'}</div>
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {customer.birthDate
                  ? format(new Date(customer.birthDate), 'dd/MM/yyyy')
                  : '-'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{formatPhoneNumber(customer.phone) || '-'}</div>
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{formatPhoneNumber(customer.mobile1) || '-'}</div>
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
            <div className="px-2 py-0.5 bg-gray-50 rounded-lg font-bold text-green-800">
              {customer.street && customer.houseNumber
                ? `${customer.street} ${customer.houseNumber}${customer.entrance ? `, ${customer.entrance}` : ''}${customer.apartment ? `, דירה ${customer.apartment}` : ''}${customer.city ? `, ${customer.city}` : ''}`
                : '-'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">{customer.healthFund || '-'}</div>
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
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {latestPrescription?.insuranceType || '-'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">סניף</label>
            {isEditing ? (
              <BranchSelect
                value={formData.branchId || null}
                onChange={(branchId) => handleChange('branchId', branchId)}
              />
            ) : (
              <div className="px-2 py-0.5 bg-slate-50/60 rounded-lg font-bold text-green-800">
                {customer.branch?.name || '-'}
              </div>
            )}
          </div>
        </div>

        {/* Related Customers */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">לקוחות קשורים</h3>
          
          {isEditing ? (
            <div className="space-y-2">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש לקוח (שם, טלפון, ת.ז.)"
                  className="input text-sm w-full"
                  dir="rtl"
                />
                {/* Search results dropdown */}
                {filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleAddRelated(c.id)}
                        className="w-full px-3 py-2 text-right hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-slate-800">{c.firstName} {c.lastName}</span>
                            {c.idNumber && <span className="text-slate-500 text-xs mr-2">• {c.idNumber}</span>}
                          </div>
                          {c.phone && <span className="text-xs text-slate-600">{c.phone}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected related customers */}
              {selectedRelatedIds.length > 0 && (
                <div className="space-y-1">
                  {selectedRelatedIds.map((id) => {
                    const related = allCustomers.find(c => c.id === id);
                    if (!related) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-xs border border-blue-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {related.firstName} {related.lastName}
                          </span>
                          {related.idNumber && (
                            <span className="text-slate-500">• {related.idNumber}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveRelated(id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="הסר"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            customer.relatedTo && customer.relatedTo.length > 0 ? (
              <div className="space-y-1">
                {customer.relatedTo.map((related) => (
                  <button
                    key={related.id}
                    onClick={() => {
                      console.log('Navigating to related customer:', related.id, related.firstName, related.lastName);
                      onNavigateToCustomer?.(related.id);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 bg-slate-50 rounded text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors border border-transparent cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {related.firstName} {related.lastName}
                      </span>
                      {related.idNumber && (
                        <span className="text-slate-500">• {related.idNumber}</span>
                      )}
                    </div>
                    {related.phone && (
                      <span className="text-slate-600">{related.phone}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">אין לקוחות קשורים</p>
            )
          )}
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

