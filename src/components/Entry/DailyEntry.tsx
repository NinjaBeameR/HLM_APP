import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../Auth/AuthProvider';

export const DailyEntry: React.FC = () => {
  const { user } = useAuth();
  const [labours, setLabours] = useState<any[]>([]);
  const [workCategories, setWorkCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    labour_id: '',
    entry_date: '',
    wage: '',
    notes: '',
    work_type: '',
    category: '',
    subcategory: '',
    attendance_status: 'present',
  });

  const [calculations, setCalculations] = useState({
    previous_balance: 0,
    wage: 0,
    new_balance: 0,
  });

  useEffect(() => {
    fetchLabours();
    fetchWorkCategories();
  }, []);

  const fetchLabours = async () => {
    const { data } = await supabase.from('labour_master').select('*').eq('is_active', true).order('full_name');
    setLabours(data || []);
  };

  const fetchWorkCategories = async () => {
    const { data } = await supabase.from('work_category').select('work_type, category, subcategory');
    setWorkCategories(data || []);
  };

  // All unique work types, categories, subcategories
  const workTypes = Array.from(new Set([
    "General",
    "Special",
    ...workCategories.map(wc => wc.work_type).filter(Boolean)
  ]));
  const categories = Array.from(new Set(workCategories.map(wc => wc.category).filter(Boolean)));
  const subcategories = Array.from(new Set(workCategories.map(wc => wc.subcategory).filter(Boolean)));

  // Fetch latest balance when labour changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (formData.labour_id) {
        const { data: labour } = await supabase
          .from('labour_master')
          .select('balance')
          .eq('id', formData.labour_id)
          .maybeSingle();
        const prevBalance = Number(labour?.balance) || 0;
        setCalculations(c => ({
          ...c,
          previous_balance: prevBalance,
          new_balance: prevBalance + Number(formData.wage || 0),
        }));
      }
    };
    fetchBalance();
  }, [formData.labour_id]);

  // Update wage and new balance on wage change
  useEffect(() => {
    setCalculations(c => ({
      ...c,
      wage: Number(formData.wage || 0),
      new_balance: c.previous_balance + Number(formData.wage || 0),
    }));
  }, [formData.wage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.labour_id ||
      !formData.entry_date ||
      !formData.wage ||
      !formData.work_type ||
      !formData.category ||
      !formData.subcategory
    ) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    setSaving(true);
    try {
      // Check for existing entry
      const { data: existingEntry } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('labour_id', formData.labour_id)
        .eq('entry_date', formData.entry_date)
        .maybeSingle();

      if (existingEntry) {
        toast.error('Entry for this labour on the selected date already exists.');
        setSaving(false);
        return;
      }

      // 1. Get current balance
      const { data: labour, error: labourError } = await supabase
        .from('labour_master')
        .select('balance')
        .eq('id', formData.labour_id)
        .maybeSingle();
      if (labourError || !labour) {
        toast.error('Could not fetch current balance.');
        setSaving(false);
        return;
      }
      const prevBalance = Number(labour.balance) || 0;
      const wageAmount = Number(formData.wage);
      const newBalance = prevBalance + wageAmount;

      // 2. Insert daily entry
      const entry = {
        labour_id: formData.labour_id, // must be a valid UUID
        entry_date: formData.entry_date, // must be a valid date string
        amount_paid: Number(formData.wage), // must be a number
        previous_balance: Number(calculations.previous_balance), // must be a number
        new_balance: Number(calculations.new_balance), // must be a number
        notes: formData.notes,
        user_id: user.id, // must be a valid UUID
        attendance_status: formData.attendance_status,
        work_type: formData.work_type,
        category: formData.category,
        subcategory: formData.subcategory,
      };
      const { error: entryError } = await supabase.from('daily_entries').insert([entry]);
      console.log(entry);
      if (entryError) {
        toast.error('Failed to save entry: ' + entryError.message);
        setSaving(false);
        return;
      }

      // 3. Update master balance
      const { error: masterError } = await supabase.from('labour_master')
        .update({ balance: newBalance })
        .eq('id', formData.labour_id);
      if (masterError) {
        toast.error('Failed to update master balance: ' + masterError.message);
        setSaving(false);
        return;
      }

      toast.success('Entry saved!');
      setFormData({ labour_id: '', entry_date: '', wage: '', notes: '', work_type: '', category: '', subcategory: '', attendance_status: 'present' });
      setCalculations({ previous_balance: 0, wage: 0, new_balance: 0 });
      fetchLabours();
    } catch (err: any) {
      toast.error('Failed to save entry: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Daily Entry</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Labour</label>
          <select
            value={formData.labour_id}
            onChange={e => setFormData({ ...formData, labour_id: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
            required
          >
            <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Labour</option>
            {labours.map(l => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            value={formData.entry_date}
            onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Wage</label>
          <input
            type="number"
            value={formData.wage}
            onChange={e => setFormData({ ...formData, wage: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Type of Work</label>
          <select
            value={formData.work_type}
            onChange={e => setFormData({ ...formData, work_type: e.target.value, category: '', subcategory: '' })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
            required
          >
            <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Work Type</option>
            {workTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Category</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
            required
          >
            <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Subcategory</label>
          <select
            value={formData.subcategory}
            onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
            required
          >
            <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Subcategory</option>
            {subcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Notes</label>
          <input
            type="text"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Attendance</label>
          <select
            value={formData.attendance_status}
            onChange={e => setFormData({ ...formData, attendance_status: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
            required
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half day">Half Day</option>
          </select>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex flex-col gap-1 text-gray-900 dark:text-gray-100">
          <div>Previous Balance: <span className="font-semibold">₹{calculations.previous_balance}</span></div>
          <div>Today's Wage: <span className="font-semibold">₹{calculations.wage}</span></div>
          <div>New Balance: <span className="font-semibold">₹{calculations.new_balance}</span></div>
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold py-2 rounded-lg shadow transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
};