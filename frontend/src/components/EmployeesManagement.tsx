import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Edit2, Trash2, BarChart3, Filter, CheckCircle, XCircle } from 'lucide-react';
import { usersApi } from '../api/users';
import { auditLogsApi } from '../api/auditLogs';
import { branchesApi } from '../api/branches';
import type { User } from '../types';
import { format } from 'date-fns';

export function EmployeesManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [filterBranch, setFilterBranch] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterApproved, setFilterApproved] = useState<string>('all');

  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', filterBranch, filterRole, filterActive],
    queryFn: () =>
      usersApi.getAll({
        branchId: filterBranch || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        isActive: filterActive !== 'all' ? filterActive === 'true' : undefined,
      }),
  });

  // Filter by approval status on client side
  const users = allUsers.filter((user) => {
    if (filterApproved === 'approved') return user.isApproved;
    if (filterApproved === 'pending') return !user.isApproved;
    return true;
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  const { data: statistics } = useQuery({
    queryKey: ['audit-logs-statistics', filterBranch],
    queryFn: () => auditLogsApi.getStatistics({ branchId: filterBranch || undefined }),
    enabled: showStatistics,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => usersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => usersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDelete = async (user: User) => {
    if (confirm(`האם אתה בטוח שברצונך לבטל את הפעלת המשתמש ${user.name}?`)) {
      await deleteMutation.mutateAsync(user.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">ניהול עובדים</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              showStatistics
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            סטטיסטיקות
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            הוסף עובד
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">פילטרים:</span>
          </div>
          <select
            value={filterBranch || ''}
            onChange={(e) => setFilterBranch(e.target.value ? parseInt(e.target.value) : null)}
            className="input"
          >
            <option value="">כל הסניפים</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="all">כל התפקידים</option>
            <option value="admin">מנהל</option>
            <option value="manager">מנהל סניף</option>
            <option value="employee">עובד</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="input"
          >
            <option value="all">כל העובדים</option>
            <option value="true">פעילים</option>
            <option value="false">לא פעילים</option>
          </select>
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            className="input"
          >
            <option value="all">כל המשתמשים</option>
            <option value="approved">מאושרים</option>
            <option value="pending">ממתינים לאישור</option>
          </select>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStatistics && statistics && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">סטטיסטיקות פעילות</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">סה"כ פעולות</div>
              <div className="text-2xl font-bold text-blue-700">{statistics.totalActions}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 mb-1">סוגי פעולות</div>
              <div className="text-2xl font-bold text-green-700">
                {statistics.actionsByType.length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">סוגי ישויות</div>
              <div className="text-2xl font-bold text-purple-700">
                {statistics.actionsByEntity.length}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">עובדים פעילים</div>
              <div className="text-2xl font-bold text-orange-700">
                {statistics.actionsByUser.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-2">פעולות לפי סוג</h4>
              <div className="space-y-2">
                {statistics.actionsByType.map((item) => (
                  <div key={item.action} className="flex justify-between items-center">
                    <span>{item.action}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-2">פעולות לפי ישות</h4>
              <div className="space-y-2">
                {statistics.actionsByEntity.map((item) => (
                  <div key={item.entityType} className="flex justify-between items-center">
                    <span>{item.entityType}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {usersLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-3">שם</th>
                  <th className="text-right p-3">אימייל</th>
                  <th className="text-right p-3">סניף</th>
                  <th className="text-right p-3">תפקיד</th>
                  <th className="text-right p-3">סטטוס</th>
                  <th className="text-right p-3">אישור</th>
                  <th className="text-right p-3">כניסה אחרונה</th>
                  <th className="text-right p-3">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.picture && (
                          <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.branch?.name || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role === 'admin'
                          ? 'מנהל'
                          : user.role === 'manager'
                            ? 'מנהל סניף'
                            : 'עובד'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isApproved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {user.isApproved ? 'מאושר' : 'ממתין לאישור'}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {!user.isApproved && (
                          <button
                            onClick={() => {
                              if (confirm(`האם אתה בטוח שברצונך לאשר את המשתמש ${user.name}?`)) {
                                approveMutation.mutate(user.id);
                              }
                            }}
                            disabled={approveMutation.isPending}
                            className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors disabled:opacity-50"
                            title="אשר משתמש"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {user.isApproved && (
                          <button
                            onClick={() => {
                              if (confirm(`האם אתה בטוח שברצונך לדחות את המשתמש ${user.name}?`)) {
                                rejectMutation.mutate(user.id);
                              }
                            }}
                            disabled={rejectMutation.isPending}
                            className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                            title="דחה משתמש"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="ערוך"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowStatistics(true);
                          }}
                          className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                          title="סטטיסטיקות"
                        >
                          <BarChart3 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          branches={branches}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          branches={branches}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
}

// Add User Modal Component
function AddUserModal({
  branches,
  onClose,
  onSuccess,
}: {
  branches: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    googleId: '',
    email: '',
    name: '',
    picture: '',
    branchId: null as number | null,
    role: 'employee' as 'admin' | 'employee' | 'manager',
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(formData),
    onSuccess: onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/60 p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">הוסף עובד חדש</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Google ID</label>
            <input
              type="text"
              value={formData.googleId}
              onChange={(e) => setFormData({ ...formData, googleId: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">אימייל</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">שם</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">תמונה (URL)</label>
            <input
              type="url"
              value={formData.picture}
              onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">סניף</label>
            <select
              value={formData.branchId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  branchId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="input"
            >
              <option value="">בחר סניף</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">תפקיד</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'admin' | 'employee' | 'manager',
                })
              }
              className="input"
            >
              <option value="employee">עובד</option>
              <option value="manager">מנהל סניף</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({
  user,
  branches,
  onClose,
  onSuccess,
}: {
  user: User;
  branches: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    picture: user.picture || '',
    isActive: user.isActive,
    branchId: user.branchId,
    role: user.role,
  });

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(user.id, formData),
    onSuccess: onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/60 p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">ערוך עובד</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">שם</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">תמונה (URL)</label>
            <input
              type="url"
              value={formData.picture}
              onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">סניף</label>
            <select
              value={formData.branchId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  branchId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="input"
            >
              <option value="">בחר סניף</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">תפקיד</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'admin' | 'employee' | 'manager',
                })
              }
              className="input"
            >
              <option value="employee">עובד</option>
              <option value="manager">מנהל סניף</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span>פעיל</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              ביטול
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

