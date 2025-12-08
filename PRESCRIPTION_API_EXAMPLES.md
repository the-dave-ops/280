# דוגמאות שימוש ב-API למרשמים

## סקירה כללית
מסמך זה מכיל דוגמאות לשימוש ב-API עבור יצירה, עדכון, וקריאה של מרשמים עם כל השדות החדשים.

---

## 1. יצירת מרשם חדש - מלא

### Request
```http
POST /api/prescriptions
Content-Type: application/json

{
  "customerId": 1,
  "type": "מרחק",
  "date": "2025-12-08T00:00:00.000Z",
  
  // נתוני מרשם לעיניים
  "r": -2.50,
  "l": -2.75,
  "cylR": -0.75,
  "axR": 180,
  "cylL": -0.50,
  "axL": 90,
  
  // נתוני PRISM
  "prismR": 0.50,
  "prismL": 0.25,
  "inOutR": "in",
  "inOutL": "out",
  "upDownR": "up",
  "upDownL": "down",
  
  // נתוני PD
  "pdR": 31.5,
  "pdL": 32.0,
  "pdTotal": 63.5,
  
  // נתוני VA
  "vaR": "6/6",
  "vaL": "6/6",
  
  // נתוני גובה
  "heightR": 25.0,
  "heightL": 25.0,
  
  // נתונים כלליים לעדשות
  "add": 1.50,
  "index": "1.67",
  "color": "חום",
  "colorPercentage": 85,
  
  // נתוני מסגרת
  "frameName": "Ray-Ban",
  "frameModel": "RB5228",
  "frameColor": "חום",
  "frameBridge": "18",
  "frameWidth": "53",
  "frameNotes": "מסגרת איכותית",
  
  // נתונים כספיים
  "healthFund": "מכבי",
  "insuranceType": "מכבי זהב",
  "price": 1500,
  "discountSource": "קמפיין 280",
  "amountToPay": 1200,
  "paid": 600,
  "balance": 600,
  "receiptNumber": "12345",
  "campaign280": true,
  
  // נתונים נוספים
  "source": "המלצה",
  "notes": "לקוח מרוצה",
  "optometristId": 1,
  "branchId": 1
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 123,
    "prescriptionNumber": 456,
    "customerId": 1,
    "type": "מרחק",
    "date": "2025-12-08T00:00:00.000Z",
    "r": -2.5,
    "l": -2.75,
    "cylR": -0.75,
    "axR": 180,
    "cylL": -0.5,
    "axL": 90,
    "prismR": 0.5,
    "prismL": 0.25,
    "inOutR": "in",
    "inOutL": "out",
    "upDownR": "up",
    "upDownL": "down",
    "pdR": 31.5,
    "pdL": 32,
    "pdTotal": 63.5,
    "vaR": "6/6",
    "vaL": "6/6",
    "heightR": 25,
    "heightL": 25,
    "add": 1.5,
    "index": "1.67",
    "color": "חום",
    "colorPercentage": 85,
    "frameName": "Ray-Ban",
    "frameModel": "RB5228",
    "frameColor": "חום",
    "frameBridge": "18",
    "frameWidth": "53",
    "frameNotes": "מסגרת איכותית",
    "healthFund": "מכבי",
    "insuranceType": "מכבי זהב",
    "price": 1500,
    "discountSource": "קמפיין 280",
    "amountToPay": 1200,
    "paid": 600,
    "balance": 600,
    "receiptNumber": "12345",
    "campaign280": true,
    "source": "המלצה",
    "notes": "לקוח מרוצה",
    "optometristId": 1,
    "branchId": 1,
    "createdAt": "2025-12-08T08:00:00.000Z",
    "updateDate": "2025-12-08T08:00:00.000Z"
  }
}
```

---

## 2. יצירת מרשם פשוט - שדות חובה בלבד

### Request
```http
POST /api/prescriptions
Content-Type: application/json

{
  "customerId": 1,
  "type": "מרחק",
  "r": -1.50,
  "l": -1.75
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 124,
    "prescriptionNumber": 457,
    "customerId": 1,
    "type": "מרחק",
    "date": "2025-12-08T08:00:00.000Z",
    "r": -1.5,
    "l": -1.75,
    "index": "1.56",
    "price": 0,
    "amountToPay": 0,
    "paid": 0,
    "balance": 0,
    "campaign280": false,
    "createdAt": "2025-12-08T08:00:00.000Z",
    "updateDate": "2025-12-08T08:00:00.000Z"
  }
}
```

---

## 3. עדכון מרשם קיים

### Request
```http
PUT /api/prescriptions/123
Content-Type: application/json

{
  "prismR": 0.75,
  "prismL": 0.50,
  "inOutR": "out",
  "inOutL": "in",
  "pdR": 32.0,
  "pdL": 31.5,
  "pdTotal": 63.5,
  "notes": "עודכן לפי בדיקה חוזרת"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 123,
    "prescriptionNumber": 456,
    "customerId": 1,
    "type": "מרחק",
    "date": "2025-12-08T00:00:00.000Z",
    "r": -2.5,
    "l": -2.75,
    "cylR": -0.75,
    "axR": 180,
    "cylL": -0.5,
    "axL": 90,
    "prismR": 0.75,
    "prismL": 0.5,
    "inOutR": "out",
    "inOutL": "in",
    "upDownR": "up",
    "upDownL": "down",
    "pdR": 32,
    "pdL": 31.5,
    "pdTotal": 63.5,
    "vaR": "6/6",
    "vaL": "6/6",
    "heightR": 25,
    "heightL": 25,
    "add": 1.5,
    "index": "1.67",
    "color": "חום",
    "colorPercentage": 85,
    "frameName": "Ray-Ban",
    "frameModel": "RB5228",
    "frameColor": "חום",
    "frameBridge": "18",
    "frameWidth": "53",
    "frameNotes": "מסגרת איכותית",
    "healthFund": "מכבי",
    "insuranceType": "מכבי זהב",
    "price": 1500,
    "discountSource": "קמפיין 280",
    "amountToPay": 1200,
    "paid": 600,
    "balance": 600,
    "receiptNumber": "12345",
    "campaign280": true,
    "source": "המלצה",
    "notes": "עודכן לפי בדיקה חוזרת",
    "optometristId": 1,
    "branchId": 1,
    "createdAt": "2025-12-08T08:00:00.000Z",
    "updateDate": "2025-12-08T08:15:00.000Z"
  }
}
```

---

## 4. קריאת מרשם לפי ID

### Request
```http
GET /api/prescriptions/123
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 123,
    "prescriptionNumber": 456,
    "customerId": 1,
    "type": "מרחק",
    "date": "2025-12-08T00:00:00.000Z",
    "r": -2.5,
    "l": -2.75,
    "cylR": -0.75,
    "axR": 180,
    "cylL": -0.5,
    "axL": 90,
    "prismR": 0.75,
    "prismL": 0.5,
    "inOutR": "out",
    "inOutL": "in",
    "upDownR": "up",
    "upDownL": "down",
    "pdR": 32,
    "pdL": 31.5,
    "pdTotal": 63.5,
    "vaR": "6/6",
    "vaL": "6/6",
    "heightR": 25,
    "heightL": 25,
    "add": 1.5,
    "index": "1.67",
    "color": "חום",
    "colorPercentage": 85,
    "frameName": "Ray-Ban",
    "frameModel": "RB5228",
    "frameColor": "חום",
    "frameBridge": "18",
    "frameWidth": "53",
    "frameNotes": "מסגרת איכותית",
    "healthFund": "מכבי",
    "insuranceType": "מכבי זהב",
    "price": 1500,
    "discountSource": "קמפיין 280",
    "amountToPay": 1200,
    "paid": 600,
    "balance": 600,
    "receiptNumber": "12345",
    "campaign280": true,
    "source": "המלצה",
    "notes": "עודכן לפי בדיקה חוזרת",
    "optometristId": 1,
    "branchId": 1,
    "createdAt": "2025-12-08T08:00:00.000Z",
    "updateDate": "2025-12-08T08:15:00.000Z",
    "customer": {
      "id": 1,
      "firstName": "יוסי",
      "lastName": "כהן",
      "idNumber": "123456789"
    },
    "optometrist": {
      "id": 1,
      "name": "ד\"ר שרה לוי"
    },
    "branch": {
      "id": 1,
      "name": "סניף תל אביב"
    }
  }
}
```

---

## 5. חיפוש מרשמים עם פילטרים

### Request
```http
GET /api/prescriptions?customerId=1&type=מרחק&limit=10&offset=0
```

### Response
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 123,
        "prescriptionNumber": 456,
        "customerId": 1,
        "type": "מרחק",
        "date": "2025-12-08T00:00:00.000Z",
        "r": -2.5,
        "l": -2.75,
        "pdTotal": 63.5,
        "index": "1.67",
        "frameName": "Ray-Ban",
        "frameModel": "RB5228",
        "price": 1500,
        "balance": 600,
        "createdAt": "2025-12-08T08:00:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 6. קבלת אפשרויות לשדות

### Request - קבלת אפשרויות VA
```http
GET /api/prescriptions/options/va
```

### Response
```json
{
  "success": true,
  "data": {
    "options": [
      "6/5",
      "6/6",
      "6/7",
      "6/8",
      "6/9",
      "6/12",
      "6/18",
      "6/24",
      "6/36",
      "6/120"
    ]
  }
}
```

### Request - קבלת אפשרויות Index
```http
GET /api/prescriptions/options/index
```

### Response
```json
{
  "success": true,
  "data": {
    "options": [
      "1.5",
      "1.56",
      "1.6",
      "1.67",
      "1.71",
      "1.74",
      "1.76",
      "ייצור",
      "סופר פלט",
      "דק סכין"
    ],
    "default": "1.56"
  }
}
```

### Request - קבלת אפשרויות צבעי מסגרת
```http
GET /api/prescriptions/options/frame-colors
```

### Response
```json
{
  "success": true,
  "data": {
    "options": [
      "אדום",
      "ירוק",
      "כחול",
      "חום",
      "ורוד",
      "זהב מט",
      "זהב מבריק",
      "כסף מבריק",
      "כסף מט",
      "ניקל",
      "אפור",
      "טורקיז",
      "כתום",
      "שחור-לבן",
      "שחור",
      "שקוף",
      "אחר"
    ]
  }
}
```

### Request - קבלת טווחים מספריים
```http
GET /api/prescriptions/options/ranges
```

### Response
```json
{
  "success": true,
  "data": {
    "prism": {
      "min": 0.25,
      "max": 4.0,
      "step": 0.25
    },
    "pd": {
      "min": 20.0,
      "max": 40.0,
      "step": 0.5
    },
    "height": {
      "min": 16.0,
      "max": 35.0,
      "step": 0.5
    },
    "axis": {
      "min": 0,
      "max": 180,
      "step": 1
    }
  }
}
```

---

## 7. Validation Errors

### Request - ערך PRISM לא תקין
```http
POST /api/prescriptions
Content-Type: application/json

{
  "customerId": 1,
  "type": "מרחק",
  "r": -1.50,
  "l": -1.75,
  "prismR": 0.33
}
```

### Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "prismR",
        "message": "PRISM value must be between 0.25 and 4.00 in steps of 0.25",
        "value": 0.33
      }
    ]
  }
}
```

### Request - ערך VA לא תקין
```http
POST /api/prescriptions
Content-Type: application/json

{
  "customerId": 1,
  "type": "מרחק",
  "r": -1.50,
  "l": -1.75,
  "vaR": "6/10"
}
```

### Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "vaR",
        "message": "VA value must be one of: 6/5, 6/6, 6/7, 6/8, 6/9, 6/12, 6/18, 6/24, 6/36, 6/120",
        "value": "6/10"
      }
    ]
  }
}
```

---

## 8. דוגמת שימוש ב-TypeScript/JavaScript

```typescript
import { 
  VA_OPTIONS, 
  INDEX_OPTIONS, 
  FRAME_COLOR_OPTIONS,
  getPrismOptions,
  getPdOptions,
  getHeightOptions,
  calculatePdTotal,
  calculateBalance,
  validators
} from './constants/prescriptionFields';

// יצירת מרשם חדש
async function createPrescription() {
  const prescriptionData = {
    customerId: 1,
    type: 'מרחק',
    r: -2.50,
    l: -2.75,
    cylR: -0.75,
    axR: 180,
    cylL: -0.50,
    axL: 90,
    prismR: 0.50,
    prismL: 0.25,
    inOutR: 'in',
    inOutL: 'out',
    upDownR: 'up',
    upDownL: 'down',
    pdR: 31.5,
    pdL: 32.0,
    vaR: '6/6',
    vaL: '6/6',
    heightR: 25.0,
    heightL: 25.0,
    add: 1.50,
    index: '1.67',
    color: 'חום',
    colorPercentage: 85,
    frameName: 'Ray-Ban',
    frameModel: 'RB5228',
    frameColor: 'חום',
    frameBridge: '18',
    frameWidth: '53',
    price: 1500,
    amountToPay: 1200,
    paid: 600,
  };

  // חישוב אוטומטי של pdTotal
  prescriptionData.pdTotal = calculatePdTotal(
    prescriptionData.pdR, 
    prescriptionData.pdL
  );

  // חישוב אוטומטי של balance
  prescriptionData.balance = calculateBalance(
    prescriptionData.amountToPay,
    prescriptionData.paid
  );

  // Validation
  if (prescriptionData.prismR && !validators.prism(prescriptionData.prismR)) {
    throw new Error('Invalid PRISM value for right eye');
  }

  if (prescriptionData.vaR && !validators.va(prescriptionData.vaR)) {
    throw new Error('Invalid VA value for right eye');
  }

  // שליחת הבקשה
  const response = await fetch('/api/prescriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prescriptionData),
  });

  return await response.json();
}

// קבלת אפשרויות לשדות
function getPrescriptionFieldOptions() {
  return {
    va: VA_OPTIONS,
    index: INDEX_OPTIONS,
    frameColors: FRAME_COLOR_OPTIONS,
    prism: getPrismOptions(),
    pd: getPdOptions(),
    height: getHeightOptions(),
  };
}
```

---

## הערות חשובות

1. **Validation**: כל הערכים צריכים לעבור validation לפני שליחה לשרת
2. **חישובים אוטומטיים**: `pdTotal` ו-`balance` צריכים להתחשב אוטומטית
3. **ברירות מחדל**: השדה `index` מקבל אוטומטית `"1.56"` אם לא צוין
4. **שדות אופציונליים**: רוב השדות הם אופציונליים, רק `customerId` ו-`type` הם חובה
5. **תאריכים**: תאריכים צריכים להיות בפורמט ISO 8601

---

**תאריך עדכון אחרון**: 08/12/2025
