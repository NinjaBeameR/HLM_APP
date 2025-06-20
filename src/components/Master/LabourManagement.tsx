import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../LoadingSpinner';

interface LabourFormData {
  full_name: string;
  address?: string;
  phone?: string;
  balance?: string; // New field for initial balance
}

interface Labour {
  id: string;
  full_name: string | null;
  address?: string | null;
  phone?: string | null;
  is_active: boolean;
  balance?: number | null; // New field for initial balance
}

export const LabourManagement = () => {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<LabourFormData>({
    full_name: '',
    address: '',
    phone: '',
    balance: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLabours();
  }, []);

  const fetchLabours = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('labour_master')
      .select('*')
      .eq('is_active', true)
      .order('full_name');
    if (error) {
      toast.error('Failed to load labours');
      setLabours([]);
    } else {
      setLabours(data || []);
    }
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    // Optional: validate balance is a number
    if (formData.balance && isNaN(Number(formData.balance))) {
      errors.balance = 'Balance must be a number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('labour_master').insert([
      {
        full_name: formData.full_name,
        address: formData.address,
        phone: formData.phone,
        is_active: true,
        balance: formData.balance ? Number(formData.balance) : 0,
      },
    ]);
    setLoading(false);
    if (error) {
      toast.error('Failed to add labour: ' + error.message);
      console.error(error);
    } else {
      toast.success('Labour added!');
      resetForm();
      fetchLabours(); // Refresh list
    }
  };

  const handleEdit = (labour: Labour) => {
    setEditingLabour(labour);
    setFormData({
      full_name: labour.full_name ?? '',
      address: labour.address ?? '',
      phone: labour.phone ?? '',
      balance: labour.balance !== undefined && labour.balance !== null ? String(labour.balance) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete all related entries before deleting labour
      await supabase.from('daily_entries').delete().eq('labour_id', id);
      await supabase.from('payments').delete().eq('labour_id', id);
      await supabase.from('labour_balances').delete().eq('labour_id', id);
      // Now delete (or set is_active: false) for the labour
      await supabase.from('labour_master').update({ is_active: false }).eq('id', id);
      fetchLabours();
      setFormData({
        full_name: '',
        address: '',
        phone: '',
      });
      setFormErrors({});
      setShowForm(false);
      setEditingLabour(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      address: '',
      phone: '',
      balance: '',
    });
    setFormErrors({});
    setShowForm(false);
    setEditingLabour(null);
  };

  const filteredLabours = Array.isArray(labours)
    ? labours.filter(l => {
        if (!l || typeof l !== 'object') return false;
        const name = l.full_name ? String(l.full_name).toLowerCase() : '';
        const phone = l.phone ? String(l.phone).toLowerCase() : '';
        const search = searchTerm ? String(searchTerm).toLowerCase() : '';
        return name.includes(search) || phone.includes(search);
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4">
      {/* Modal always rendered at top level */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingLabour ? 'Edit Labour' : 'Add New Labour'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.full_name ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {formErrors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter mobile number (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                  Balance
                </label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={e => setFormData({ ...formData, balance: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.balance ? 'border-red-500' : ''}`}
                  placeholder="Enter opening balance (optional)"
                />
                {formErrors.balance && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.balance}</p>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLabour ? 'Update' : 'Add'} Labour
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Labour Profile Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Add and manage labour profiles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Labour
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Labour List or Empty State */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredLabours.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No labours found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first labour
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredLabours.map((labour) => (
              <div key={labour.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{labour.full_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {labour.phone && <span>{labour.phone}</span>}
                    {labour.address && <span className="ml-2">{labour.address}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(labour)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(labour.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};