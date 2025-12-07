import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import type { Branch } from '../types';

interface BranchesViewProps {
  onBranchClick?: (branchId: number) => void;
}

export function BranchesView({ onBranchClick }: BranchesViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get<{ branches: Branch[] }>('/branches');
      return response.data.branches;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">ניהול סניפים</h1>
        <button
          onClick={() => {
            setEditingBranch(null);
            setIsAddModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 ml-1" />
          סניף חדש
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div 
            key={branch.id} 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onBranchClick && onBranchClick(branch.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">{branch.name}</h3>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingBranch(branch);
                    setIsAddModalOpen(true);
                  }}
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  title="ערוך"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                  title="מחק"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {branch.address && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>כתובת:</strong> {branch.address}
              </div>
            )}
            {branch.phone && (
              <div className="text-sm text-gray-600">
                <strong>טלפון:</strong> {branch.phone}
              </div>
            )}
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          אין סניפים. הוסף סניף חדש כדי להתחיל.
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <BranchModal
          branch={editingBranch}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingBranch(null);
          }}
        />
      )}
    </div>
  );
}

interface BranchModalProps {
  branch: Branch | null;
  onClose: () => void;
}

function BranchModal({ branch, onClose }: BranchModalProps) {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
  });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (branch) {
        await apiClient.put(`/branches/${branch.id}`, data);
      } else {
        await apiClient.post('/branches', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/60 max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">{branch ? 'ערוך סניף' : 'סניף חדש'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">שם סניף *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              dir="rtl"
            />
          </div>
          <div>
            <label className="label">כתובת</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              dir="rtl"
            />
          </div>
          <div>
            <label className="label">טלפון</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              dir="ltr"
            />
          </div>
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
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

