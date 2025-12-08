import React from 'react';
import { Prescription, Customer } from '../types';

interface PrescriptionPrintViewProps {
  prescription: Prescription;
  customer: Customer;
}

export const PrescriptionPrintView: React.FC<PrescriptionPrintViewProps> = ({ prescription, customer }) => {

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A5;
            margin: 8mm;
          }
          
          * {
            visibility: hidden;
          }
          
          .print-container,
          .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
        
        .print-container {
          font-family: Arial, sans-serif;
          background: white;
          color: #000;
        }
        
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 3px solid #000;
        }
        
        .print-logo {
          width: 120px;
          height: auto;
        }
        
        .print-customer-info {
          text-align: right;
          font-size: 10px;
          line-height: 1.4;
        }
        
        .print-customer-info strong {
          font-weight: bold;
          color: #000;
        }
        
        .print-section {
          margin-bottom: 25px;
        }
        
        .print-section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 12px;
          border-bottom: 2px solid #cbd5e1;
          padding-bottom: 5px;
        }
        
        .print-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .print-info-item {
          font-size: 14px;
          padding: 5px 0;
        }
        
        .print-info-label {
          font-weight: 600;
          color: #475569;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: center;
          font-size: 13px;
        }
        
        .print-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #1e40af;
        }
        
        .print-table td {
          background-color: white;
        }
        
        .print-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        
        .print-button {
          margin: 20px auto;
          display: block;
          padding: 12px 30px;
          background-color: #1e40af;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .print-button:hover {
          background-color: #1e3a8a;
        }
      `}</style>

      {/* Print content */}
      <div className="print-container" dir="rtl">
        <div style={{ padding: '8mm' }}>
        {/* Header with logo and customer info */}
        <div className="print-header">
          <img src="/logo.png" alt="רשת משקפיים 280" className="print-logo" />
          <div className="print-customer-info">
            <div><strong>שם:</strong> {customer.firstName} {customer.lastName}</div>
            <div><strong>טלפון:</strong> {customer.mobile1 || customer.phone || 'לא צוין'}</div>
            <div><strong>לקוח מספר:</strong> {customer.idNumber}</div>
            <div><strong>כתובת:</strong> {customer.street || ''} {customer.city || ''}</div>
            <div><strong>טלפונים:</strong></div>
            <div><strong>ת.ז:</strong> {new Date(prescription.date).toLocaleDateString('he-IL')}</div>
            <div><strong>תאריך ידוע:</strong></div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', margin: '8px 0', padding: '6px', backgroundColor: '#333', color: 'white' }}>
          מרשם מס' {prescription.prescriptionNumber || prescription.id} מתאריך {new Date(prescription.date).toLocaleDateString('he-IL')}
        </div>

        {/* Prescription Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', width: '15%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>R:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.r?.toFixed(2) || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', width: '15%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>Cyl R:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.cylR?.toFixed(2) || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', width: '15%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>AX R:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.axR || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', color: '#0066cc', backgroundColor: '#e6f2ff', fontWeight: 'bold' }}>L:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.l?.toFixed(2) || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', color: '#0066cc', backgroundColor: '#e6f2ff', fontWeight: 'bold' }}>Cyl L:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.cylL?.toFixed(2) || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', color: '#0066cc', backgroundColor: '#e6f2ff', fontWeight: 'bold' }}>AX L:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{prescription.axL || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>index:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>{prescription.index || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>PD:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>{prescription.pdTotal?.toFixed(2) || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>ADD:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>{prescription.add?.toFixed(2) || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>color:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px' }} colSpan={3}>{prescription.color || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>%:</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px' }}>{prescription.colorPercentage || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Additional fields */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', width: '25%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>קופ"ח:</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontSize: '11px' }}>{prescription.healthFund || ''}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', width: '25%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>מחירון:</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontSize: '11px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>סוג ביטוח:</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontSize: '11px' }} colSpan={3}>{prescription.insuranceType || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>הערות:</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontSize: '10px' }} colSpan={3}>{prescription.notes || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer - compact */}
        <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '8px', color: '#666' }}>
          מספר מרשם: {prescription.prescriptionNumber || prescription.id} | תאריך הדפסה: {new Date().toLocaleDateString('he-IL')}
        </div>
        </div>
      </div>
    </>
  );
};
