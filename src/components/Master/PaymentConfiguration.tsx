import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Search, DollarSign } from 'lucide-react';
import { supabase, type PaymentTypeMaster } from '../../lib/supabase';
import { LoadingSpinner } from '../Layout/LoadingSpinner';
import toast from 'react-hot-toast';

export const PaymentConfiguration: React.FC = () => {
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentTypeMaster | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    payment_type: '',
    rate: '',
    unit: 'day'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const unitOptions = [
    { value: 'hour', label: 'Per Hour' },
    { value: 'day', label: 'Per Day' },
    { value: 'piece', label: 'Per Piece' }
  ];

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_type_master')
        .select('*')
        .eq('is_active', true)
        .order('payment_type');

      if (error) throw error;
      setPaymentTypes(data || []);
    } catch (error) {
      console.error('Error fetching payment types:', error);
      toast.error('Failed to load payment types');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.payment_type.trim()) {
      errors.payment_type = 'Payment type is required';
    }
    
    if (!formData.rate.trim()) {
      errors.rate = 'Rate is required';
    } else if (isNaN(Number(formData.rate)) || Number(formData.rate) < 0) {
      errors.rate = 'Please enter a valid positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        payment_type: formData.payment_type,
        rate: Number(formData.rate),
        unit: formData.unit
      };

      if (editingPayment) {
        const { error } = await supabase
          .from('payment_type_master')
          .update(submitData)
          .eq('id', editingPayment.id);

        if (error) throw error;
        toast.success('Payment type updated successfully');
      } else {
        const { error } = await supabase
          .from('payment_type_master')
          .insert([submitData]);

        if (error) throw error;
        toast.success('Payment type added successfully');
      }

      resetForm();
      fetchPaymentTypes();
    } catch (error) {
      console.error('Error saving payment type:', error);
      toast.error('Failed to save payment type');
    }
  };

  const handleEdit = (paymentType: PaymentTypeMaster) => {
    setEditingPayment(paymentType);
    setFormData({
      payment_type: paymentType.payment_type,
      rate: paymentType.rate.toString(),
      unit: paymentType.unit
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment type?')) return;

    try {
      const { error } = await supabase
        .from('payment_type_master')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment type removed successfully');
      fetchPaymentTypes();
    } catch (error) {
      console.error('Error deleting payment type:', error);
      toast.error('Failed to remove payment type');
    }
  };

  const resetForm = () => {
    setFormData({
      payment_type: '',
      rate: '',
      unit: 'day'
    });
    setFormErrors({});
    setShowForm(false);
    setEditingPayment(null);
  };

  const filteredPaymentTypes = paymentTypes.filter(paymentType =>
    paymentType.payment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Configuration</h2>
          <p className="text-gray-600">Define payment types, rates, and units</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Type
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search payment types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPayment ? 'Edit Payment Type' : 'Add New Payment Type'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type *
                </label>
                <input
                  type="text"
                  value={formData.payment_type}
                  onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.payment_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Basic Labor, Skilled Work"
                />
                {formErrors.payment_type && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.payment_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter rate amount"
                />
                {formErrors.rate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPayment ? 'Update' : 'Add'} Payment Type
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

      {/* Payment Types List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredPaymentTypes.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payment types found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first payment type
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPaymentTypes.map((paymentType) => (
              <div key={paymentType.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{paymentType.payment_type}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">₹{paymentType.rate}</span>
                            <span>/ {paymentType.unit}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(paymentType.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(paymentType)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(paymentType.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};