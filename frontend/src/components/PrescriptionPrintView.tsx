import React from 'react';
import { Prescription, Customer } from '../types';

interface PrescriptionPrintViewProps {
  prescription: Prescription;
  customer: Customer;
}

export const PrescriptionPrintView: React.FC<PrescriptionPrintViewProps> = ({ prescription, customer }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        
        .print-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
          color: #000;
        }
        
        .print-header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .print-title {
          font-size: 32px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .print-subtitle {
          font-size: 20px;
          color: #334155;
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

      {/* Print button - hidden when printing */}
      <button onClick={handlePrint} className="print-button no-print">
        🖨️ הדפס מרשם
      </button>

      {/* Print content */}
      <div className="print-container" dir="rtl">
        {/* Header */}
        <div className="print-header">
          <div className="print-title">רשת משקפיים 280</div>
          <div className="print-subtitle">מרשם משקפיים</div>
        </div>

        {/* Customer Information */}
        <div className="print-section">
          <div className="print-section-title">פרטי לקוח</div>
          <div className="print-info-grid">
            <div className="print-info-item">
              <span className="print-info-label">שם מלא: </span>
              {customer.firstName} {customer.lastName}
            </div>
            <div className="print-info-item">
              <span className="print-info-label">תעודת זהות: </span>
              {customer.idNumber}
            </div>
            <div className="print-info-item">
              <span className="print-info-label">טלפון: </span>
              {customer.mobile1 || customer.phone || 'לא צוין'}
            </div>
            <div className="print-info-item">
              <span className="print-info-label">תאריך מרשם: </span>
              {new Date(prescription.date).toLocaleDateString('he-IL')}
            </div>
          </div>
        </div>

        {/* Prescription Data */}
        <div className="print-section">
          <div className="print-section-title">נתוני מרשם</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>עין</th>
                <th>SPH</th>
                <th>CYL</th>
                <th>Axis</th>
                <th>PD</th>
                <th>VA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>R</strong></td>
                <td>{prescription.r?.toFixed(2) || '-'}</td>
                <td>{prescription.cylR?.toFixed(2) || '-'}</td>
                <td>{prescription.axR || '-'}</td>
                <td>{prescription.pdR?.toFixed(2) || '-'}</td>
                <td>{prescription.vaR || '-'}</td>
              </tr>
              <tr>
                <td><strong>L</strong></td>
                <td>{prescription.l?.toFixed(2) || '-'}</td>
                <td>{prescription.cylL?.toFixed(2) || '-'}</td>
                <td>{prescription.axL || '-'}</td>
                <td>{prescription.pdL?.toFixed(2) || '-'}</td>
                <td>{prescription.vaL || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Additional Data */}
        {(prescription.add || prescription.pdTotal || prescription.prismR || prescription.prismL || 
          prescription.heightR || prescription.heightL) && (
          <div className="print-section">
            <div className="print-section-title">נתונים נוספים</div>
            <div className="print-info-grid">
              {prescription.add && (
                <div className="print-info-item">
                  <span className="print-info-label">ADD: </span>
                  {prescription.add.toFixed(2)}
                </div>
              )}
              {prescription.pdTotal && (
                <div className="print-info-item">
                  <span className="print-info-label">PD Total: </span>
                  {prescription.pdTotal.toFixed(2)}
                </div>
              )}
              {prescription.prismR && (
                <div className="print-info-item">
                  <span className="print-info-label">PRISM R: </span>
                  {prescription.prismR.toFixed(2)} {prescription.inOutR || ''} {prescription.upDownR || ''}
                </div>
              )}
              {prescription.prismL && (
                <div className="print-info-item">
                  <span className="print-info-label">PRISM L: </span>
                  {prescription.prismL.toFixed(2)} {prescription.inOutL || ''} {prescription.upDownL || ''}
                </div>
              )}
              {prescription.heightR && (
                <div className="print-info-item">
                  <span className="print-info-label">Height R: </span>
                  {prescription.heightR.toFixed(2)}
                </div>
              )}
              {prescription.heightL && (
                <div className="print-info-item">
                  <span className="print-info-label">Height L: </span>
                  {prescription.heightL.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Frame Information */}
        {(prescription.frameName || prescription.frameModel || prescription.frameColor || 
          prescription.frameBridge || prescription.frameWidth) && (
          <div className="print-section">
            <div className="print-section-title">פרטי מסגרת</div>
            <div className="print-info-grid">
              {prescription.frameName && (
                <div className="print-info-item">
                  <span className="print-info-label">שם: </span>
                  {prescription.frameName}
                </div>
              )}
              {prescription.frameModel && (
                <div className="print-info-item">
                  <span className="print-info-label">דגם: </span>
                  {prescription.frameModel}
                </div>
              )}
              {prescription.frameColor && (
                <div className="print-info-item">
                  <span className="print-info-label">צבע: </span>
                  {prescription.frameColor}
                </div>
              )}
              {prescription.frameBridge && (
                <div className="print-info-item">
                  <span className="print-info-label">גשר: </span>
                  {prescription.frameBridge}
                </div>
              )}
              {prescription.frameWidth && (
                <div className="print-info-item">
                  <span className="print-info-label">רוחב: </span>
                  {prescription.frameWidth}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {(prescription.notes || prescription.frameNotes) && (
          <div className="print-section">
            <div className="print-section-title">הערות</div>
            {prescription.notes && (
              <div className="print-info-item" style={{ marginBottom: '10px' }}>
                <span className="print-info-label">הערות עדשות: </span>
                {prescription.notes}
              </div>
            )}
            {prescription.frameNotes && (
              <div className="print-info-item">
                <span className="print-info-label">הערות מסגרת: </span>
                {prescription.frameNotes}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <div>מספר מרשם: {prescription.prescriptionNumber || prescription.id}</div>
          <div>תאריך הפקה: {new Date().toLocaleDateString('he-IL')}</div>
        </div>
      </div>
    </>
  );
};
