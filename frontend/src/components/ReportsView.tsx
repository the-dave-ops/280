import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileDown, Filter } from 'lucide-react';
import { reportsApi, type ReportFilters } from '../api/reports';
import { branchesApi } from '../api/branches';
import type { Branch } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsView() {
  // Set default end date to today
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState<ReportFilters>({
    endDate: today,
  });
  const [reportType, setReportType] = useState<string>('revenue');

  // Get branches for filter
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  // Get report data
  const { data: revenueData = [] } = useQuery({
    queryKey: ['reports', 'revenue', filters],
    queryFn: () => reportsApi.getRevenueByBranch(filters),
  });

  const { data: prescriptionsData = [] } = useQuery({
    queryKey: ['reports', 'prescriptions', filters],
    queryFn: () => reportsApi.getPrescriptionsByBranch(filters),
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['reports', 'customers', filters],
    queryFn: () => reportsApi.getCustomersByBranch(filters),
  });

  const { data: employeesData = [] } = useQuery({
    queryKey: ['reports', 'employees', filters],
    queryFn: () => reportsApi.getEmployeesByBranch(filters),
  });

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleGeneratePDF = async () => {
    try {
      const blob = await reportsApi.generatePDF(reportType, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('שגיאה ביצירת ה-PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">גרפים ודוחות</h1>
      </div>

      {/* Filter Form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-700">סינון דוחות</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label text-sm">תאריך התחלה</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label text-sm">תאריך סיום</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label text-sm">סניף</label>
            <select
              value={filters.branchId || ''}
              onChange={(e) => handleFilterChange('branchId', e.target.value ? parseInt(e.target.value) : null)}
              className="input"
              dir="rtl"
            >
              <option value="">כל הסניפים</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-sm">סוג דוח ל-PDF</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input"
              dir="rtl"
            >
              <option value="revenue">הכנסות</option>
              <option value="prescriptions">מרשמים</option>
              <option value="customers">לקוחות</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({})}
            className="btn btn-secondary"
          >
            נקה סינון
          </button>
          <button
            onClick={handleGeneratePDF}
            className="btn btn-primary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            הורד PDF
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">הכנסות לפי סניף</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData} dir="rtl">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branchName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="הכנסות (₪)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prescriptions Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">מרשמים לפי סניף</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prescriptionsData} dir="rtl">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branchName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="מספר מרשמים" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customers Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">לקוחות לפי סניף</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart dir="rtl">
              <Pie
                data={customersData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ branchName, count }) => `${branchName}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {customersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Employees Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">עובדים לפי סניף</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeesData} dir="rtl">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branchName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="מספר עובדים" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Trend Line Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">מגמת הכנסות לפי סניף</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData} dir="rtl">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="branchName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="הכנסות (₪)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

