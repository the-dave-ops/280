import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { prescriptionsApi } from '../api/prescriptions';
import type { Prescription, Customer } from '../types';
import {
  VA_OPTIONS,
  INDEX_OPTIONS,
  FRAME_COLOR_OPTIONS,
  IN_OUT_OPTIONS,
  UP_DOWN_OPTIONS,
  getPrismOptions,
  getPdOptions,
  getHeightOptions,
  calculatePdTotal,
  FIELD_LABELS,
} from '../constants/prescriptionFields';

const healthFunds = ['מאוחדת', 'מכבי', 'לאומית', 'כללית'];

// Insurance types mapping for each health fund
const insuranceTypesByHealthFund: Record<string, string[]> = {
  'כללית': ['רגיל', 'מושלם', 'מושלם זהב', 'מושלם פלטינום'],
  'מכבי': ['רגיל', 'מכבי שלי', 'מכבי זהב', 'מכבי כסף'],
  'מאוחדת': ['רגיל', 'מאוחדת עדיף', 'עדיף פלטינום'],
  'לאומית': ['רגיל', 'לאומית כסף', 'לאומית זהב', 'לאומית פלטינום'],
};

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSuccess: (prescription: Prescription) => void;
}

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

export function AddPrescriptionModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: AddPrescriptionModalProps) {
  const [formData, setFormData] = useState<Partial<Prescription>>({
    customerId: customer.id,
    type: 'מרחק',
    date: new Date().toISOString().split('T')[0],
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Prescription>) => prescriptionsApi.create(data),
    onSuccess: (prescription) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      onSuccess(prescription);
      onClose();
      // Reset form
      setFormData({
        customerId: customer.id,
        type: 'מרחק',
        date: new Date().toISOString().split('T')[0],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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
  };

  // Get available insurance types based on selected health fund
  const availableInsuranceTypes = formData.healthFund 
    ? insuranceTypesByHealthFund[formData.healthFund] || []
    : [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            מרשם חדש - {customer.firstName} {customer.lastName}
          </h2>
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
              <label className="label">סוג מרשם *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="input"
              >
                <option value="מרחק">מרחק</option>
                <option value="קריאה">קריאה</option>
                <option value="עדשות מגע">עדשות מגע</option>
                <option value="מולטיפוקל">מולטיפוקל</option>
              </select>
            </div>
            <div>
              <label className="label">תאריך *</label>
              <input
                type="date"
                required
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('date', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
          </div>

          {/* Eye Prescription Data - R and L rows */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">נתוני עיניים</h3>
            
            {/* R Row */}
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-3">
              <h4 className="font-medium mb-3 text-blue-700">R (ימין)</h4>
              
              {/* שורה ראשונה - SPH, CYL, Axis, PRISM, PD, גובה */}
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div>
                  <label className="label text-xs">SPH</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.r || ''}
                    onChange={(e) => handleChange('r', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">CYL</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.cylR || ''}
                    onChange={(e) => handleChange('cylR', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">Axis</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={formData.axR || ''}
                    onChange={(e) => handleChange('axR', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label text-xs">PRISM</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="4.00"
                    value={formData.prismR || ''}
                    onChange={(e) => handleChange('prismR', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">PD</label>
                  <input
                    type="number"
                    step="0.5"
                    min="20.00"
                    max="40.00"
                    value={formData.pdR || ''}
                    onChange={(e) => {
                      const newPdR = parseFloat(e.target.value) || null;
                      handleChange('pdR', newPdR);
                      if (newPdR && formData.pdL) {
                        handleChange('pdTotal', calculatePdTotal(newPdR, formData.pdL));
                      }
                    }}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="31.5"
                  />
                </div>
                <div>
                  <label className="label text-xs">גובה</label>
                  <input
                    type="number"
                    step="0.5"
                    min="16.00"
                    max="35.00"
                    value={formData.heightR || ''}
                    onChange={(e) => handleChange('heightR', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="25.0"
                  />
                </div>
              </div>
              
              {/* שורה שנייה - In/Out, Up/Down, VA */}
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-3"></div> {/* רווח */}
                <div>
                  <label className="label text-xs">In/Out</label>
                  <select
                    value={formData.inOutR || ''}
                    onChange={(e) => handleChange('inOutR', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {IN_OUT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Up/Down</label>
                  <select
                    value={formData.upDownR || ''}
                    onChange={(e) => handleChange('upDownR', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {UP_DOWN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">VA</label>
                  <select
                    value={formData.vaR || ''}
                    onChange={(e) => handleChange('vaR', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {VA_OPTIONS.map(va => (
                      <option key={va} value={va}>{va}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* L Row */}
            <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
              <h4 className="font-medium mb-3 text-green-700">L (שמאל)</h4>
              
              {/* שורה ראשונה - SPH, CYL, Axis, PRISM, PD, גובה */}
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div>
                  <label className="label text-xs">SPH</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.l || ''}
                    onChange={(e) => handleChange('l', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">CYL</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.cylL || ''}
                    onChange={(e) => handleChange('cylL', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">Axis</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={formData.axL || ''}
                    onChange={(e) => handleChange('axL', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label text-xs">PRISM</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="4.00"
                    value={formData.prismL || ''}
                    onChange={(e) => handleChange('prismL', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label text-xs">PD</label>
                  <input
                    type="number"
                    step="0.5"
                    min="20.00"
                    max="40.00"
                    value={formData.pdL || ''}
                    onChange={(e) => {
                      const newPdL = parseFloat(e.target.value) || null;
                      handleChange('pdL', newPdL);
                      if (newPdL && formData.pdR) {
                        handleChange('pdTotal', calculatePdTotal(formData.pdR, newPdL));
                      }
                    }}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="32.0"
                  />
                </div>
                <div>
                  <label className="label text-xs">גובה</label>
                  <input
                    type="number"
                    step="0.5"
                    min="16.00"
                    max="35.00"
                    value={formData.heightL || ''}
                    onChange={(e) => handleChange('heightL', parseFloat(e.target.value) || null)}
                    className="input text-sm"
                    dir="ltr"
                    placeholder="25.0"
                  />
                </div>
              </div>
              
              {/* שורה שנייה - In/Out, Up/Down, VA */}
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-3"></div> {/* רווח */}
                <div>
                  <label className="label text-xs">In/Out</label>
                  <select
                    value={formData.inOutL || ''}
                    onChange={(e) => handleChange('inOutL', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {IN_OUT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Up/Down</label>
                  <select
                    value={formData.upDownL || ''}
                    onChange={(e) => handleChange('upDownL', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {UP_DOWN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">VA</label>
                  <select
                    value={formData.vaL || ''}
                    onChange={(e) => handleChange('vaL', e.target.value || null)}
                    className="input text-sm"
                  >
                    <option value="">-</option>
                    {VA_OPTIONS.map(va => (
                      <option key={va} value={va}>{va}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* General Data */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">נתונים כלליים</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">PD סה"כ</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.pdTotal || ''}
                  onChange={(e) => handleChange('pdTotal', parseFloat(e.target.value) || null)}
                  className="input"
                  dir="ltr"
                  placeholder="63.5"
                  title="סה&quot;כ PD - מתחשב אוטומטית מ-pdR + pdL"
                />
              </div>
              <div>
                <label className="label">Add</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.add || ''}
                  onChange={(e) => handleChange('add', parseFloat(e.target.value) || null)}
                  className="input"
                  dir="ltr"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">index</label>
                <input
                  type="text"
                  value={formData.index || ''}
                  onChange={(e) => handleChange('index', e.target.value)}
                  onKeyDown={(e) => handleArrowKeyNavigation(e, INDEX_OPTIONS as unknown as string[], formData.index, (value) => handleChange('index', value))}
                  className="input"
                  dir="ltr"
                  placeholder="1.5, 1.56, 1.6..."
                />
              </div>
              <div>
                <label className="label">color</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                  onKeyDown={(e) => handleArrowKeyNavigation(e, FRAME_COLOR_OPTIONS as unknown as string[], formData.color, (value) => handleChange('color', value))}
                  className="input"
                  dir="rtl"
                  placeholder="שקוף, כחול, חום..."
                />
              </div>
              <div>
                <label className="label">%</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.colorPercentage || ''}
                  onChange={(e) =>
                    handleChange('colorPercentage', parseFloat(e.target.value) || null)
                  }
                  className="input"
                  dir="ltr"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="label">קופת חולים:</label>
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
                <label className="label">סוג ביטוח:</label>
                <select
                  value={formData.insuranceType || ''}
                  onChange={(e) => handleChange('insuranceType', e.target.value || null)}
                  className="input"
                  dir="rtl"
                  disabled={!formData.healthFund}
                >
                  <option value="">השאר ריק</option>
                  {availableInsuranceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Frame Data */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">נתוני מסגרת</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">שם</label>
                <input
                  type="text"
                  value={formData.frameName || ''}
                  onChange={(e) => handleChange('frameName', e.target.value)}
                  className="input"
                  dir="rtl"
                  placeholder="שם המסגרת"
                />
              </div>
              <div>
                <label className="label">דגם</label>
                <input
                  type="text"
                  value={formData.frameModel || ''}
                  onChange={(e) => handleChange('frameModel', e.target.value)}
                  className="input"
                  dir="rtl"
                  placeholder="דגם המסגרת"
                />
              </div>
              <div>
                <label className="label">צבע</label>
                <input
                  type="text"
                  value={formData.frameColor || ''}
                  onChange={(e) => handleChange('frameColor', e.target.value)}
                  className="input"
                  dir="rtl"
                  placeholder="צבע המסגרת"
                />
              </div>
              <div>
                <label className="label">גשר</label>
                <input
                  type="text"
                  value={formData.frameBridge || ''}
                  onChange={(e) => handleChange('frameBridge', e.target.value)}
                  className="input"
                  dir="ltr"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="label">רוחב</label>
                <input
                  type="text"
                  value={formData.frameWidth || ''}
                  onChange={(e) => handleChange('frameWidth', e.target.value)}
                  className="input"
                  dir="ltr"
                  placeholder="רוחב"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">הערות מסגרת</label>
              <textarea
                value={formData.frameNotes || ''}
                onChange={(e) => handleChange('frameNotes', e.target.value)}
                className="input"
                dir="rtl"
                rows={3}
                placeholder="הערות על המסגרת..."
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="border-t pt-4">
            <label className="label">הערות</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input"
              dir="rtl"
              rows={3}
              placeholder="הערות נוספות..."
            />
          </div>

          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              שגיאה ביצירת מרשם. נסה שוב.
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
              {createMutation.isPending ? 'שומר...' : 'שמור מרשם'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

