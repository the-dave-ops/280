import { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Trash2, Copy, Plus, ChevronLeft, ChevronRight, Eye, FileText, Glasses, DollarSign, Printer } from 'lucide-react';
import { prescriptionsApi } from '../api/prescriptions';
import { optometristsApi } from '../api/optometrists';
import type { Prescription, Customer } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const healthFunds = ['מאוחדת', 'מכבי', 'לאומית', 'כללית'];
const indexOptions = ['1.5', '1.56', '1.6', '1.67', '1.71', '1.74', '1.76', 'ייצור', 'סופר פלט', 'דק סכין'];
const colorOptions = ['שקוף', 'כחול', 'חום', 'אפור', 'ירוק', 'ורוד', 'סגול', 'צהוב'];
const frameColorOptions = ['אדום', 'ירוק', 'כחול', 'חום', 'ורוד', 'זהב מט', 'זהב מבריק', 'כסף מבריק', 'כסף מט', 'ניקל', 'אפור', 'טורקיז', 'כתום', 'שחור-לבן', 'שחור', 'שקוף', 'אחר'];
const prescriptionSourceOptions = ['אופטומטריסט', 'משקף קיים', 'בדיקה חיצונית'];

// Generate HTML for printing in new window
const generatePrintHTML = (prescription: Prescription, customer: Customer) => `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>מרשם ${prescription.prescriptionNumber || prescription.id}</title>
  <style>
    @page { size: A5; margin: 8mm; }
    body { font-family: Arial; margin: 0; padding: 8mm; }
    .header { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 3px solid #000; }
    .logo { width: 120px; }
    .customer-info { text-align: right; font-size: 10px; line-height: 1.4; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin: 8px 0; padding: 6px; background: #333; color: white; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; border: 2px solid #000; }
    table.data-table { direction: ltr; }
    table.info-table { direction: rtl; }
    td { border: 1px solid #000; padding: 6px; text-align: center; }
    td.label { background: white; color: rgba(0, 0, 0, 0.5); font-weight: bold; text-align: center; width: 15%; font-size: 10px; }
    td.value { font-size: 14px; font-weight: bold; color: #000; }
    tr.blue td.label { background: white; color: rgba(0, 0, 0, 0.5); }
    .footer { margin-top: 10px; padding-top: 6px; border-top: 1px solid #ccc; text-align: center; font-size: 8px; color: #666; }
    @media print {
      table.data-table { direction: ltr !important; }
      table.info-table { direction: rtl !important; }
      td.label { background: white !important; color: rgba(0, 0, 0, 0.5) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      td.value { color: #000 !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo.png" alt="רשת משקפיים 280" class="logo" />
    <div class="customer-info">
      <div><strong>שם:</strong> ${customer.firstName} ${customer.lastName}</div>
      <div><strong>טלפון:</strong> ${customer.mobile1 || customer.phone || 'לא צוין'}</div>
      <div><strong>לקוח מספר:</strong> ${customer.idNumber}</div>
      <div><strong>כתובת:</strong> ${customer.street || ''} ${customer.city || ''}</div>
      <div><strong>ת.ז:</strong> ${new Date(prescription.date).toLocaleDateString('he-IL')}</div>
    </div>
  </div>
  <div class="title">מרשם מס' ${prescription.prescriptionNumber || prescription.id} מתאריך ${new Date(prescription.date).toLocaleDateString('he-IL')}</div>
  <table class="data-table">
    <tr>
      <td class="label">R:</td><td class="value">${prescription.r?.toFixed(2) || ''}</td>
      <td class="label">Cyl R:</td><td class="value">${prescription.cylR?.toFixed(2) || ''}</td>
      <td class="label">AX R:</td><td class="value">${prescription.axR || ''}</td>
    </tr>
    <tr class="blue">
      <td class="label">L:</td><td class="value">${prescription.l?.toFixed(2) || ''}</td>
      <td class="label">Cyl L:</td><td class="value">${prescription.cylL?.toFixed(2) || ''}</td>
      <td class="label">AX L:</td><td class="value">${prescription.axL || ''}</td>
    </tr>
    <tr>
      <td class="label">index:</td><td class="value">${prescription.index || ''}</td>
      <td class="label">PD:</td><td class="value">${prescription.pdTotal?.toFixed(2) || ''}</td>
      <td class="label">ADD:</td><td class="value">${prescription.add?.toFixed(2) || ''}</td>
    </tr>
    <tr>
      <td class="label">color:</td><td colspan="3">${prescription.color || ''}</td>
      <td class="label">%:</td><td>${prescription.colorPercentage || ''}</td>
    </tr>
  </table>
  <table class="info-table">
    <tr>
      <td class="label" style="width:25%">קופ"ח:</td><td class="value">${prescription.healthFund || ''}</td>
      <td class="label" style="width:25%">מחירון:</td><td class="value"></td>
    </tr>
    <tr><td class="label">סוג ביטוח:</td><td class="value" colspan="3">${prescription.insuranceType || ''}</td></tr>
    <tr><td class="label">מקור מרשם:</td><td class="value" colspan="3">${prescription.prescriptionSource || ''}</td></tr>
    <tr><td class="label">מק"ט מסגרת:</td><td class="value" colspan="3">${prescription.frameSku || ''}</td></tr>
    <tr><td class="label">הערות:</td><td class="value" colspan="3" style="font-size:12px">${prescription.notes || ''}</td></tr>
  </table>
  <div style="margin: 12px 0; padding: 10px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 4px; font-size: 10px; line-height: 1.6; text-align: right; color: #856404;">
    ידוע לי כי ההתקשרות עימי תיהיה באמצעות שליחת הודעת טקסט ו/או הודעה קולית ואני מאשר/ת לרשת 280 לעדכן אותי בכל דבר שנוגע לבניי המנוי לרשת. מבצעים, פרומוים שונים והטבות מעת לעת.תחילתם.
  </div>
  <div class="footer">מספר מרשם: ${prescription.prescriptionNumber || prescription.id} | תאריך הדפסה: ${new Date().toLocaleDateString('he-IL')}</div>
</body>
</html>
`;

// Insurance types mapping for each health fund
const insuranceTypesByHealthFund: Record<string, string[]> = {
  'כללית': ['רגיל', 'מושלם', 'מושלם זהב', 'מושלם פלטינום'],
  'מכבי': ['רגיל', 'מכבי שלי', 'מכבי זהב', 'מכבי כסף'],
  'מאוחדת': ['רגיל', 'מאוחדת עדיף', 'עדיף פלטינום'],
  'לאומית': ['רגיל', 'לאומית כסף', 'לאומית זהב', 'לאומית פלטינום'],
};

// Helper function to handle arrow key navigation
const handleArrowKeyNavigation = (
  e: React.KeyboardEvent<HTMLInputElement>,
  options: string[],
  currentValue: string | null | undefined,
  onChange: (value: string) => void
) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const currentIndex = currentValue ? options.indexOf(currentValue) : -1;
    let newIndex: number;
    
    if (e.key === 'ArrowUp') {
      // Arrow Up: go to previous, or wrap to last if at start or no current value
      if (currentIndex <= 0) {
        newIndex = options.length - 1;
      } else {
        newIndex = currentIndex - 1;
      }
    } else {
      // Arrow Down: go to next, or start from first if at end or no current value
      if (currentIndex >= options.length - 1 || currentIndex === -1) {
        newIndex = 0;
      } else {
        newIndex = currentIndex + 1;
      }
    }
    
    onChange(options[newIndex]);
  }
};

// Helper function to validate if AX is required when CYL is present
const validateAxisRequired = (prescription: Prescription): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  // Check right eye
  if ((prescription.cylR !== null && prescription.cylR !== 0 && prescription.cylR !== undefined) && 
      (prescription.axR === null || prescription.axR === 0 || prescription.axR === undefined)) {
    missingFields.push('axR');
  }
  
  // Check left eye
  if ((prescription.cylL !== null && prescription.cylL !== 0 && prescription.cylL !== undefined) && 
      (prescription.axL === null || prescription.axL === 0 || prescription.axL === undefined)) {
    missingFields.push('axL');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Helper function to handle Enter key to move to next field
const handleEnterKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const form = e.currentTarget.form;
    if (!form) {
      // If not in a form, find all focusable elements in the document
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
    } else {
      const elements = Array.from(form.elements) as HTMLElement[];
      const currentIndex = elements.indexOf(e.currentTarget as HTMLElement);
      const nextElement = elements[currentIndex + 1] as HTMLElement;
      if (nextElement && nextElement.focus) {
        nextElement.focus();
      }
    }
  }
};

interface PrescriptionDetailsProps {
  prescription: Prescription;
  customer: Customer;
  onUpdate: (prescription: Prescription) => void;
  onClose: () => void;
  onAddNew?: () => void;
}

export function PrescriptionDetails({
  prescription,
  customer,
  onUpdate,
  onClose,
  onAddNew,
}: PrescriptionDetailsProps) {
  const [formData, setFormData] = useState<Partial<Prescription>>(prescription);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Get all prescriptions for this customer to enable navigation
  const { data: allPrescriptions = [] } = useQuery({
    queryKey: ['prescriptions', 'customer', customer.id],
    queryFn: () => prescriptionsApi.getAll({ customerId: customer.id }),
  });

  // Get all optometrists for the dropdown
  const { data: optometrists = [] } = useQuery({
    queryKey: ['optometrists'],
    queryFn: () => optometristsApi.getAll(),
  });

  // Sort prescriptions by date (newest first) and find current index
  const sortedPrescriptions = useMemo(() => {
    return [...allPrescriptions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    });
  }, [allPrescriptions]);

  const currentIndex = useMemo(() => {
    return sortedPrescriptions.findIndex(p => p.id === prescription.id);
  }, [sortedPrescriptions, prescription.id]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sortedPrescriptions.length - 1 && currentIndex >= 0;

  const handlePrevious = async () => {
    if (hasPrevious && currentIndex > 0) {
      const previousPrescription = sortedPrescriptions[currentIndex - 1];
      // Fetch full prescription data to ensure all fields are loaded
      try {
        const fullPrescription = await prescriptionsApi.getById(previousPrescription.id);
        onUpdate(fullPrescription);
      } catch (error) {
        console.error('Error fetching previous prescription:', error);
        // Fallback to the prescription we have
        onUpdate(previousPrescription);
      }
    }
  };

  const handleNext = async () => {
    if (hasNext && currentIndex < sortedPrescriptions.length - 1) {
      const nextPrescription = sortedPrescriptions[currentIndex + 1];
      // Fetch full prescription data to ensure all fields are loaded
      try {
        const fullPrescription = await prescriptionsApi.getById(nextPrescription.id);
        onUpdate(fullPrescription);
      } catch (error) {
        console.error('Error fetching next prescription:', error);
        // Fallback to the prescription we have
        onUpdate(nextPrescription);
      }
    }
  };
  
  // Get available insurance types based on selected health fund
  const availableInsuranceTypes = formData.healthFund 
    ? insuranceTypesByHealthFund[formData.healthFund] || []
    : [];

  // Update formData when prescription prop changes
  useEffect(() => {
    setFormData(prescription);
  }, [prescription]);

  // Check if this is a new prescription (no ID yet)
  const isNewPrescription = !prescription.id;

  // Auto-calculate pdTotal when pdR or pdL changes
  useEffect(() => {
    const pdR = formData.pdR;
    const pdL = formData.pdL;
    
    // Calculate total: if both exist, sum them; if only one exists, use it; if none, set to null
    let total: number | null = null;
    
    if (pdR !== null && pdR !== undefined && pdL !== null && pdL !== undefined) {
      total = Number(pdR) + Number(pdL);
    } else if (pdR !== null && pdR !== undefined) {
      total = Number(pdR);
    } else if (pdL !== null && pdL !== undefined) {
      total = Number(pdL);
    }
    
    if (formData.pdTotal !== total) {
      setFormData(prev => ({ ...prev, pdTotal: total }));
    }
  }, [formData.pdR, formData.pdL]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Prescription>) => {
      // If it's a new prescription, use create API, otherwise use update API
      if (!prescription.id) {
        return prescriptionsApi.create(data);
      } else {
        return prescriptionsApi.update(prescription.id, data);
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      onUpdate(updated);
    },
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const verifyDeleteMutation = useMutation({
    mutationFn: (password: string) => prescriptionsApi.verifyDelete(prescription.id, password),
    onSuccess: () => {
      // Password verified, proceed with deletion
      deleteMutation.mutate();
      setShowDeleteModal(false);
      setDeletePassword('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'סיסמה שגויה');
      setDeletePassword('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => prescriptionsApi.delete(prescription.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      onClose();
    },
  });

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletePassword) {
      alert('נא להזין סיסמת מנהל');
      return;
    }
    verifyDeleteMutation.mutate(deletePassword);
  };

  const duplicateMutation = useMutation({
    mutationFn: () => {
      // Can't duplicate a prescription that doesn't exist yet
      if (!prescription.id) {
        throw new Error('Cannot duplicate an unsaved prescription');
      }
      return prescriptionsApi.duplicate(prescription.id);
    },
    onSuccess: (duplicatedPrescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      // Update to show the new duplicated prescription
      onUpdate(duplicatedPrescription);
      // Update formData with new prescription data
      setFormData(duplicatedPrescription);
    },
  });

  const createNewPrescriptionMutation = useMutation({
    mutationFn: () => prescriptionsApi.create({
      customerId: customer.id,
      type: 'מרחק',
      date: new Date(),
      // Keep same branch and optometrist as current prescription
      branchId: prescription.branchId || undefined,
      optometristId: prescription.optometristId || undefined,
      // All other fields are null/empty
      r: null,
      l: null,
      cylR: null,
      axR: null,
      cylL: null,
      axL: null,
      pd: null,
      add: null,
      index: null,
      color: null,
      colorPercentage: null,
      frameName: null,
      frameModel: null,
      frameColor: null,
      frameSku: null,
      frameC: null,
      frameWidth: null,
      frameNotes: null,
      healthFund: null,
      insuranceType: null,
      prescriptionSource: null,
      price: 0,
      discountSource: null,
      amountToPay: 0,
      paid: 0,
      balance: 0,
      receiptNumber: null,
      campaign280: false,
      source: null,
      notes: null,
    }),
    onSuccess: (newPrescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Update to show the new prescription
      onUpdate(newPrescription);
      // Update formData with new prescription data
      setFormData(newPrescription);
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => {
      // Can't convert a prescription that doesn't exist yet
      if (!prescription.id) {
        throw new Error('Cannot convert an unsaved prescription');
      }
      return prescriptionsApi.convertToReading(prescription.id);
    },
    onSuccess: (newPrescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Update to show the new converted prescription
      onUpdate(newPrescription);
    },
  });

  const handleChange = (field: keyof Prescription, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // When health fund changes, reset insurance type to 'רגיל' (default)
      if (field === 'healthFund' && value) {
        const defaultInsuranceType = 'רגיל';
        newData.insuranceType = defaultInsuranceType;
      }
      
      return newData;
    });
    
    // Auto-save with debounce
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      // Prepare the data for saving
      setFormData((currentData) => {
        const dataToSave = { ...currentData, [field]: value };
        
        // Handle health fund change
        if (field === 'healthFund' && value) {
          dataToSave.insuranceType = 'רגיל';
        }
        
        // Clean up payment fields
        const cleanData: Partial<Prescription> = { ...dataToSave };
        if (cleanData.amountToPay !== undefined) {
          cleanData.amountToPay = cleanData.amountToPay === '' || cleanData.amountToPay === null ? null : Number(cleanData.amountToPay);
        }
        if (cleanData.paid !== undefined) {
          cleanData.paid = cleanData.paid === '' || cleanData.paid === null ? null : Number(cleanData.paid);
        }
        
        // Save to backend
        updateMutation.mutate(cleanData);
        
        return currentData;
      });
    }, 1000); // 1 second debounce
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const renderFieldLTR = (
    label: string,
    field: keyof Prescription,
    type: 'text' | 'number' | 'select' | 'textarea' = 'text',
    options?: string[],
    step?: string,
    className: string = '',
    min?: string,
    max?: string
  ) => {
    const value = formData[field];
    const isBoldLabel = label === 'R' || label === 'L';
    
    // Check if this is an AX field that's required but missing
    const isAxFieldMissing = (
      (field === 'axR' && formData.cylR !== null && formData.cylR !== 0 && (formData.axR === null || formData.axR === 0)) ||
      (field === 'axL' && formData.cylL !== null && formData.cylL !== 0 && (formData.axL === null || formData.axL === 0))
    );

    if (type === 'select' && options) {
        return (
          <div className={`flex items-center gap-1 ${className}`} dir="ltr">
            <span className={`${isBoldLabel ? 'text-base font-bold' : 'text-xs font-semibold'} text-slate-600 whitespace-nowrap`}>{label}:</span>
            <select
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value || null)}
              onKeyDown={handleEnterKeyNavigation}
              className="input text-sm py-1.5 px-2 flex-1"
              dir="ltr"
            >
              <option value="">השאר ריק</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }
      if (type === 'textarea') {
        // Special styling for notes field - make it taller with placeholder
        const isNotes = field === 'notes';
        const minHeight = isNotes ? 'min-h-[80px]' : 'min-h-[40px]';
        const rows = isNotes ? 3 : 1;
        const isBoldLabel = label === 'R' || label === 'L';
        const textDir = isNotes ? 'rtl' : 'ltr'; // RTL for notes field
        
        return (
          <div className={`flex ${isNotes ? 'flex-col' : 'items-start flex-row-reverse'} gap-1 ${className}`} dir="ltr">
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value || null)}
              onKeyDown={handleEnterKeyNavigation}
              className={`input text-sm py-1 px-2 flex-1 ${minHeight}`}
              placeholder={isNotes ? label : undefined}
              dir={textDir}
              rows={rows}
            />
            {!isNotes && <span className={`${isBoldLabel ? 'text-base font-bold' : 'text-xs font-semibold'} text-slate-600 whitespace-nowrap pt-1.5`}>{label}:</span>}
          </div>
        );
      }
      // Check if this field should support arrow key navigation
      const isIndexField = field === 'index';
      const isColorField = field === 'color';
      const navigationOptions = isIndexField ? indexOptions : isColorField ? colorOptions : undefined;
      
      // Check if this field should be formatted with 2 decimal places
      const shouldFormatDecimals = type === 'number' && ['r', 'l', 'cylR', 'cylL', 'axR', 'axL'].includes(field as string);
      
      return (
        <div className={`flex items-center gap-1 ${className}`} dir="ltr">
          <span className={`${isBoldLabel ? 'text-base font-bold' : 'text-xs font-semibold'} text-slate-600 whitespace-nowrap`}>{label}:</span>
          <input
            type={type}
            step={step}
            min={min}
            max={max}
            value={value !== null && value !== undefined && shouldFormatDecimals ? Number(value).toFixed(2) : (value || '')}
            onChange={(e) =>
              handleChange(
                field,
                type === 'number' ? (parseFloat(e.target.value) || null) : e.target.value || null
              )
            }
            onBlur={(e) => {
              // Format to 2 decimal places on blur for specific fields
              if (shouldFormatDecimals && e.target.value) {
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  handleChange(field, numValue);
                }
              }
            }}
            onKeyDown={(e) => {
              handleEnterKeyNavigation(e);
              
              // Handle Shift+Arrow for whole number increments on number fields
              if (type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.shiftKey) {
                e.preventDefault();
                const currentValue = typeof value === 'number' ? value : 0;
                const increment = e.key === 'ArrowUp' ? 1 : -1;
                const newValue = currentValue + increment;
                handleChange(field, newValue);
                return;
              }
              
              if (navigationOptions) {
                handleArrowKeyNavigation(e, navigationOptions, value as string, (newValue) => handleChange(field, newValue));
              }
            }}
            className={`input text-sm py-1.5 px-2 flex-1 ${isAxFieldMissing ? 'border-2 border-red-500 bg-red-50' : ''}`}
            dir="ltr"
          />
        </div>
      );
  };

  const renderFieldRTL = (
    label: string,
    field: keyof Prescription,
    type: 'text' | 'number' | 'select' | 'textarea' = 'text',
    options?: string[],
    step?: string,
    className: string = ''
  ) => {
    const value = formData[field];

    if (type === 'select' && options) {
        return (
          <div className={`flex items-center gap-1 ${className}`} dir="rtl">
            <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">{label}:</span>
            <select
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value || null)}
              onKeyDown={handleEnterKeyNavigation}
              className="input text-sm py-1.5 px-2 flex-1"
              dir="rtl"
            >
              <option value="">השאר ריק</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }
      if (type === 'textarea') {
        // Special styling for frameNotes - make it taller
        const isFrameNotes = field === 'frameNotes';
        const minHeight = isFrameNotes ? 'min-h-[80px]' : 'min-h-[40px]';
        const rows = isFrameNotes ? 3 : 1;
        
        return (
          <div className={`flex ${isFrameNotes ? 'flex-col' : 'items-start'} gap-1 ${className}`} dir="rtl">
            {!isFrameNotes && <span className="text-xs text-slate-600 whitespace-nowrap font-semibold pt-1.5">{label}:</span>}
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value || null)}
              onKeyDown={handleEnterKeyNavigation}
              className={`input text-sm py-1 px-2 flex-1 ${minHeight}`}
              placeholder={isFrameNotes ? label : undefined}
              dir="rtl"
              rows={rows}
            />
          </div>
        );
      }
      // Check if receiptNumber is required but missing
      const isReceiptNumberMissing = field === 'receiptNumber' && (!value || value === '');
      
      return (
        <div className={`flex items-center gap-1 ${className}`} dir="rtl">
          <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">{label}:</span>
          <input
            type={type}
            step={step}
            value={value || ''}  
            onChange={(e) =>
              handleChange(
                field,
                type === 'number' ? (parseFloat(e.target.value) || null) : e.target.value || null
              )
            }
            onKeyDown={handleEnterKeyNavigation}
            className={`input text-sm py-1.5 px-2 flex-1 ${isReceiptNumberMissing ? 'border-2 border-red-500 bg-red-50' : ''}`}
            dir="rtl"
          />
        </div>
      );
  };

  return (
    <div className="card bg-slate-200/90 space-y-2 p-3">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="מרשם קודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="מרשם הבא"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-base font-bold text-slate-800">פרטי מרשם</h2>
          {prescription.prescriptionNumber && (
            <div className="bg-orange-100 px-1 py-0 rounded-sm border border-orange-200">
              <span className="text-xs font-bold text-green-800">
                מרשם מס' {prescription.prescriptionNumber}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 mr-2" dir="rtl">
            <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">תאריך:</span>
            <input
              type="date"
              value={format(new Date(prescription.date), 'yyyy-MM-dd')}
              onChange={(e) => handleChange('date', e.target.value)}
              className="input text-sm py-1.5 px-2 w-36"
              dir="ltr"
            />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors disabled:opacity-50"
            title="שכפל"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const validation = validateAxisRequired(prescription);
              if (!validation.isValid) {
                alert('שגיאה: כאשר יש ערך בשדה CYL (צילינדר), חייב להיות ערך בשדה AX (מעלות).\n\nאנא מלא את השדות החסרים לפני הדפסה.');
                return;
              }
              
              // Open new window with print content
              const printWindow = window.open('', '_blank', 'width=800,height=600');
              if (printWindow) {
                printWindow.document.write(generatePrintHTML(prescription, customer));
                printWindow.document.close();
                
                // Wait for content to load, then print
                printWindow.onload = () => {
                  printWindow.print();
                  // Close window after print dialog is closed
                  printWindow.onafterprint = () => {
                    printWindow.close();
                  };
                };
              }
            }}
            className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
            title="הדפס מרשם"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => createNewPrescriptionMutation.mutate()}
            disabled={createNewPrescriptionMutation.isPending}
            className="p-1.5 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-600 transition-colors disabled:opacity-50"
            title="הוסף מרשם חדש (ריק)"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteClick}
              disabled={deleteMutation.isPending || verifyDeleteMutation.isPending}
              className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
              title="מחק"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="flex items-center gap-2 flex-wrap" dir="rtl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">סוג:</span>
          <div className="flex items-center gap-1">
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              onKeyDown={handleEnterKeyNavigation}
              className="input text-sm py-1.5 px-2"
              style={{ width: '150px' }}
            >
              <option value="מרחק">מרחק</option>
              <option value="קריאה">קריאה</option>
              <option value="עדשות מגע">עדשות מגע</option>
              <option value="מולטיפוקל">מולטיפוקל</option>
            </select>
            {prescription.type === 'מרחק' && (
              <button
                onClick={() => {
                  if (prescription.add && prescription.add > 0) {
                    convertMutation.mutate();
                  } else {
                    alert('נדרש ערך ADD גדול מ-0 להמרה לקריאה');
                  }
                }}
                disabled={convertMutation.isPending || !prescription.add || prescription.add <= 0}
                className="p-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 border border-purple-200"
                title={prescription.add && prescription.add > 0 ? "העתק לקריאה (R+ADD, L+ADD, PD-3)" : "נדרש ADD > 0"}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {renderFieldRTL('קופת חולים', 'healthFund', 'select', healthFunds)}
        {renderFieldRTL('סוג ביטוח', 'insuranceType', 'select', availableInsuranceTypes)}
        {renderFieldRTL('מקור מרשם', 'prescriptionSource', 'select', prescriptionSourceOptions)}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">שם עובד:</span>
          <select
            value={formData.optometristId || ''}
            onChange={(e) => handleChange('optometristId', e.target.value ? parseInt(e.target.value) : null)}
            className="input text-sm py-1.5 px-2"
            style={{ minWidth: '150px' }}
          >
            <option value="">השאר ריק</option>
            {optometrists.map((opt: any) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Eye Prescription Data - R and L rows */}
      <div className="border-2 border-blue-300 rounded-lg p-2 bg-blue-50/30">
        <div className="flex gap-2">
          <div className="bg-blue-200 text-blue-800 p-1.5 rounded-md flex items-center justify-center" style={{ minWidth: '28px', minHeight: '28px' }}>
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1" dir="ltr">
            {/* כפתור הרחבה */}
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="mb-2 px-3 py-1 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center gap-1"
            >
              {showAdvancedFields ? 'הסתר שדות מתקדמים <<' : 'שדות מתקדמים >>'}
            </button>
            {/* Header Row with Labels */}
            <div className="grid gap-1 px-1" style={{ gridTemplateColumns: showAdvancedFields ? '0.5fr 1fr 1fr 1fr 1fr 1.2fr 1fr 1.5fr 1.5fr 1.5fr' : '0.5fr 1fr 1fr 1fr 1fr' }}>
              <div className="text-xs font-semibold text-slate-600 text-center"></div>
              <div className="text-xs font-semibold text-slate-600 text-center">SPH</div>
              <div className="text-xs font-semibold text-slate-600 text-center">CYL</div>
              <div className="text-xs font-semibold text-slate-600 text-center">Axis</div>
              <div className="text-xs font-semibold text-slate-600 text-center">PD</div>
              {showAdvancedFields && (
                <>
                  <div className="text-xs font-semibold text-slate-600 text-center">PRISM</div>
                  <div className="text-xs font-semibold text-slate-600 text-center">גובה</div>
                  <div className="text-xs font-semibold text-slate-600 text-center">In/Out</div>
                  <div className="text-xs font-semibold text-slate-600 text-center">Up/Down</div>
                  <div className="text-xs font-semibold text-slate-600 text-center">VA</div>
                </>
              )}
            </div>
            
            {/* R Row */}
            <div className="bg-blue-100 rounded p-1 border border-blue-200">
              <div className="grid gap-1" style={{ gridTemplateColumns: showAdvancedFields ? '0.5fr 1fr 1fr 1fr 1fr 1.2fr 1fr 1.5fr 1.5fr 1.5fr' : '0.5fr 1fr 1fr 1fr 1fr' }}>
                <div className="text-xs font-bold text-white bg-blue-600 rounded flex items-center justify-center py-1">R</div>
                {renderFieldLTR('', 'r', 'number', undefined, '0.25')}
                {renderFieldLTR('', 'cylR', 'number', undefined, '0.25')}
                {renderFieldLTR('', 'axR', 'number', undefined, '1', '', '0', '180')}
                {renderFieldLTR('', 'pdR', 'number', undefined, '0.5', '', '20', '40')}
                {showAdvancedFields && (
                  <>
                    {renderFieldLTR('', 'prismR', 'number', undefined, '0.25', '', '0.25', '4')}
                    {renderFieldLTR('', 'heightR', 'number', undefined, '0.5', '', '16', '35')}
                    {renderFieldLTR('', 'inOutR', 'select', ['in', 'out'])}
                    {renderFieldLTR('', 'upDownR', 'select', ['up', 'down'])}
                    {renderFieldLTR('', 'vaR', 'select', ['6/5', '6/6', '6/7', '6/8', '6/9', '6/12', '6/18', '6/24', '6/36', '6/120'])}
                  </>
                )}
              </div>
            </div>

            {/* L Row */}
            <div className="bg-green-100 rounded p-1 border border-green-200">
              <div className="grid gap-1" style={{ gridTemplateColumns: showAdvancedFields ? '0.5fr 1fr 1fr 1fr 1fr 1.2fr 1fr 1.5fr 1.5fr 1.5fr' : '0.5fr 1fr 1fr 1fr 1fr' }}>
                <div className="text-xs font-bold text-white bg-green-600 rounded flex items-center justify-center py-1">L</div>
                {renderFieldLTR('', 'l', 'number', undefined, '0.25')}
                {renderFieldLTR('', 'cylL', 'number', undefined, '0.25')}
                {renderFieldLTR('', 'axL', 'number', undefined, '1', '', '0', '180')}
                {renderFieldLTR('', 'pdL', 'number', undefined, '0.5', '', '20', '40')}
                {showAdvancedFields && (
                  <>
                    {renderFieldLTR('', 'prismL', 'number', undefined, '0.25', '', '0.25', '4')}
                    {renderFieldLTR('', 'heightL', 'number', undefined, '0.5', '', '16', '35')}
                    {renderFieldLTR('', 'inOutL', 'select', ['in', 'out'])}
                    {renderFieldLTR('', 'upDownL', 'select', ['up', 'down'])}
                    {renderFieldLTR('', 'vaL', 'select', ['6/5', '6/6', '6/7', '6/8', '6/9', '6/12', '6/18', '6/24', '6/36', '6/120'])}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Data */}
      <div className="border-2 border-purple-300 rounded-lg p-2 bg-purple-50/30">
        <div className="flex gap-2">
          <div className="bg-purple-200 text-purple-800 p-1.5 rounded-md flex items-center justify-center" style={{ minWidth: '28px', minHeight: '28px' }}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 flex gap-2" dir="ltr">
            {/* בלוק 1: הערות עדשות - חצי מהרוחב */}
            <div className="flex-1">
              {renderFieldLTR('הערות עדשות', 'notes', 'textarea')}
            </div>
            {/* בלוק 2: 5 שדות בשתי שורות - חצי מהרוחב */}
            <div className="flex-1 grid grid-cols-3 gap-2 content-start">
              {/* PD Total - Read-only calculated field */}
              <div className="flex items-center gap-1" dir="ltr">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">PD Total:</span>
                <div className="px-2 py-1.5 bg-blue-50/60 rounded text-sm flex-1 min-h-[32px] flex items-center font-semibold text-blue-800 border border-blue-200">
                  {formData.pdTotal !== null && formData.pdTotal !== undefined ? Number(formData.pdTotal).toFixed(2) : ''}
                </div>
              </div>
              {renderFieldLTR('Add', 'add', 'number', undefined, '0.25')}
              {renderFieldLTR('index', 'index', 'select', indexOptions)}
              {renderFieldLTR('color', 'color', 'text')}
              {renderFieldLTR('%', 'colorPercentage', 'number', undefined, '0.1')}
            </div>
          </div>
        </div>
      </div>

      {/* Frame Data */}
      <div className="border-2 border-amber-300 rounded-lg p-2 bg-amber-50/30">
        <div className="flex gap-2" dir="rtl">
          <div className="bg-amber-200 text-amber-800 p-1.5 rounded-md flex items-center justify-center" style={{ minWidth: '28px', minHeight: '28px' }}>
            <Glasses className="w-5 h-5" />
          </div>
          <div className="flex-1 flex gap-2">
            {/* בלוק 1: 5 שדות בשתי שורות - חצי מהרוחב */}
            <div className="flex-1 grid grid-cols-3 gap-2 content-start">
              {renderFieldRTL('שם', 'frameName', 'text')}
              {renderFieldRTL('דגם', 'frameModel', 'text')}
              {renderFieldRTL('צבע', 'frameColor', 'select', frameColorOptions)}
              {renderFieldRTL('מק"ט', 'frameSku', 'text')}
              {renderFieldRTL('גשר', 'frameBridge', 'text')}
              {renderFieldRTL('רוחב', 'frameWidth', 'text')}
            </div>
            {/* בלוק 2: הערות מסגרת - חצי מהרוחב */}
            <div className="flex-1">
              {renderFieldRTL('הערות מסגרת', 'frameNotes', 'textarea')}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Data */}
      <div className="border-2 border-green-300 rounded-lg p-2 bg-green-50/30">
        <div className="flex gap-2" dir="rtl">
          <div className="bg-green-200 text-green-800 p-1.5 rounded-md flex items-center justify-center" style={{ minWidth: '28px', minHeight: '28px' }}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center gap-1" dir="rtl">
            <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">לתשלום:</span>
            <input
              type="number"
              step="0.01"
              value={formData.amountToPay || ''}
              onChange={(e) => handleChange('amountToPay', parseFloat(e.target.value) || null)}
              onKeyDown={(e) => {
                handleEnterKeyNavigation(e);
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const currentValue = formData.amountToPay || 0;
                  // Shift+Arrow: increment by 1, Arrow alone: increment by 10
                  const increment = e.shiftKey ? (e.key === 'ArrowUp' ? 1 : -1) : (e.key === 'ArrowUp' ? 10 : -10);
                  const newValue = Math.max(0, currentValue + increment);
                  handleChange('amountToPay', newValue);
                }
              }}
              className="input text-sm py-1.5 px-2 flex-1"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-1" dir="rtl">
            <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">שולם:</span>
            <input
              type="number"
              step="0.01"
              value={formData.paid || ''}
              onChange={(e) => handleChange('paid', parseFloat(e.target.value) || null)}
              onKeyDown={(e) => {
                handleEnterKeyNavigation(e);
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const currentValue = formData.paid || 0;
                  // Shift+Arrow: increment by 1, Arrow alone: increment by 10
                  const increment = e.shiftKey ? (e.key === 'ArrowUp' ? 1 : -1) : (e.key === 'ArrowUp' ? 10 : -10);
                  const newValue = Math.max(0, currentValue + increment);
                  handleChange('paid', newValue);
                }
              }}
              className="input text-sm py-1.5 px-2 flex-1"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-1" dir="rtl">
            <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">יתרה:</span>
            <div className="px-2 py-1.5 bg-slate-50/60 rounded text-base flex-1 min-h-[32px] flex items-center font-bold text-green-800">
              {prescription.balance || 0} ₪
            </div>
          </div>
              {renderFieldRTL('מס\' קבלה', 'receiptNumber', 'text')}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">מחיקת מרשם</h3>
            <p className="text-sm text-slate-600 mb-4">
              האם אתה בטוח שברצונך למחוק מרשם זה? פעולה זו אינה ניתנת לביטול.
            </p>
            <div className="mb-4">
              <label className="label text-sm">סיסמת מנהל</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input"
                placeholder="הזן סיסמת מנהל"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteConfirm();
                  }
                  if (e.key === 'Escape') {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="btn btn-secondary"
                disabled={verifyDeleteMutation.isPending}
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={verifyDeleteMutation.isPending || !deletePassword}
                className="btn btn-danger"
              >
                {verifyDeleteMutation.isPending ? 'מאמת...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
