import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const PaymentScreen = () => {
  const [labours, setLabours] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedLabour, setSelectedLabour] = useState<string>('');
  const [form, setForm] = useState({ date: '', amount: '', mode: '', narration: '' });
  const [loading, setLoading] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (selectedLabour) {
        const { data: labour } = await supabase
          .from('labour_master')
          .select('balance')
          .eq('id', selectedLabour)
          .maybeSingle();
        setPendingAmount(Number(labour?.balance) || 0);
      }
    };
    fetchBalance();
  }, [selectedLabour, payments]);

  const fetchAll = async () => {
    await Promise.all([fetchLabours(), fetchPayments()]);
  };

  const fetchLabours = async () => {
    const { data } = await supabase.from('labour_master').select('*').eq('is_active', true).order('full_name');
    setLabours(data || []);
  };

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments').select('*').order('date', { ascending: false });
    setPayments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabour || !form.amount || !form.date) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      // 1. Get current balance
      const { data: labour, error: labourError } = await supabase
        .from('labour_master')
        .select('balance')
        .eq('id', selectedLabour)
        .maybeSingle();
      if (labourError || !labour) {
        toast.error('Could not fetch current balance.');
        setLoading(false);
        return;
      }
      const prevBalance = Number(labour.balance) || 0;
      const paymentAmount = Number(form.amount);
      const newBalance = prevBalance - paymentAmount;

      // 2. Insert into payments
      const { error: paymentError } = await supabase.from('payments').insert([{
        labour_id: selectedLabour,
        date: form.date,
        amount: paymentAmount,
        mode: form.mode,
        narration: form.narration,
      }]);
      if (paymentError) {
        toast.error('Failed to add payment: ' + paymentError.message);
        setLoading(false);
        return;
      }

      // 3. Update master balance
      const { error: masterError } = await supabase.from('labour_master')
        .update({ balance: newBalance })
        .eq('id', selectedLabour);
      if (masterError) {
        toast.error('Failed to update master balance: ' + masterError.message);
        setLoading(false);
        return;
      }

      toast.success('Payment added!');
      setForm({ date: '', amount: '', mode: '', narration: '' });
      await fetchPayments();
      await fetchLabours();
    } catch (error: any) {
      toast.error('Failed to add payment: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-100 text-center">Payments</h1>
      {selectedLabour && (
        <div className="mb-4 p-4 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 font-semibold text-center">
          Pending Amount: ₹{pendingAmount}
        </div>
      )}
      <div className="mb-6">
        <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Select Labour</label>
        <select
          value={selectedLabour}
          onChange={e => setSelectedLabour(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
        >
          <option value="" disabled className="text-gray-400 dark:text-gray-500">-- Select Labour --</option>
          {labours.map(labour => (
            <option key={labour.id} value={labour.id}>
              {labour.full_name}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Mode</label>
            <input
              type="text"
              value={form.mode}
              onChange={e => setForm({ ...form, mode: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Narration</label>
            <input
              type="text"
              value={form.narration}
              onChange={e => setForm({ ...form, narration: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 py-3 z-10">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold py-3 rounded-lg shadow transition-colors disabled:opacity-50 text-lg"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Payment'}
          </button>
        </div>
      </form>
      <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-100 text-center">Payment History</h2>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-sm">
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Labour</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Mode</th>
              <th className="p-4 text-left">Narration</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-300 text-sm">
            {payments.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{new Date(payment.date).toLocaleDateString()}</td>
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                  {labours.find(l => l.id === payment.labour_id)?.full_name}
                </td>
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{payment.amount}</td>
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{payment.mode}</td>
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">{payment.narration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {payments.map(payment => (
          <div key={payment.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 shadow">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{new Date(payment.date).toLocaleDateString()}</span>
              <span className="text-blue-700 dark:text-blue-300 font-bold">₹{payment.amount}</span>
            </div>
            <div className="text-gray-700 dark:text-gray-200">
              <div><b>Labour:</b> {labours.find(l => l.id === payment.labour_id)?.full_name}</div>
              <div><b>Mode:</b> {payment.mode}</div>
              <div><b>Narration:</b> {payment.narration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};