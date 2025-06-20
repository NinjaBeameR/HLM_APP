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

  // New state for editing
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

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

  const workTypes = Array.from(new Set([
    "General",
    "Special",
    ...workCategories.map(wc => wc.work_type).filter(Boolean)
  ]));
  const categories = Array.from(new Set(workCategories.map(wc => wc.category).filter(Boolean)));
  const subcategories = Array.from(new Set(workCategories.map(wc => wc.subcategory).filter(Boolean)));

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

  useEffect(() => {
    setCalculations(c => {
      const wageNum = Number(formData.wage);
      return {
        ...c,
        wage: isNaN(wageNum) ? 0 : wageNum,
        new_balance: c.previous_balance + (isNaN(wageNum) ? 0 : wageNum),
      };
    });
  }, [formData.wage]);

  // Fetch entries for selected labour
  useEffect(() => {
    const fetchEntries = async () => {
      if (formData.labour_id) {
        const { data } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('labour_id', formData.labour_id)
          .order('entry_date', { ascending: true });
        setEntries(data || []);
      } else {
        setEntries([]);
      }
    };
    fetchEntries();
  }, [formData.labour_id, saving]);

  // Edit handler
  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      labour_id: entry.labour_id,
      entry_date: entry.entry_date,
      wage: entry.amount_paid.toString(),
      notes: entry.notes || '',
      work_type: entry.work_type || '',
      category: entry.category || '',
      subcategory: entry.subcategory || '',
      attendance_status: entry.attendance_status || 'present',
    });
  };

  // Delete handler
  const handleDeleteEntry = async (entry: any) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    setSaving(true);
    try {
      // 1. Delete the entry
      await supabase.from('daily_entries').delete().eq('id', entry.id);

      // 2. Update balances for all subsequent entries
      const { data: subsequentEntries } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('labour_id', entry.labour_id)
        .gt('entry_date', entry.entry_date)
        .order('entry_date', { ascending: true });

      let balance = entry.previous_balance;
      for (const subEntry of subsequentEntries || []) {
        balance += Number(subEntry.amount_paid || 0);
        await supabase.from('daily_entries').update({
          previous_balance: balance - Number(subEntry.amount_paid || 0),
          new_balance: balance,
        }).eq('id', subEntry.id);
      }

      // 3. Update master balance
      await supabase.from('labour_master')
        .update({ balance })
        .eq('id', entry.labour_id);

      toast.success('Entry deleted!');
      setSaving(false);
      setEditingEntry(null);
      setFormData({
        labour_id: formData.labour_id, // keep current selection!
        entry_date: '',
        wage: '',
        notes: '',
        work_type: '',
        category: '',
        subcategory: '',
        attendance_status: 'present'
      });
      setCalculations({ previous_balance: 0, wage: 0, new_balance: 0 });
      fetchLabours();
    } catch (err: any) {
      toast.error('Failed to delete entry: ' + err.message);
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAbsent = formData.attendance_status === 'absent';
    if (
      !formData.labour_id ||
      !formData.entry_date ||
      (!isAbsent && (
        !formData.wage ||
        !formData.work_type ||
        !formData.category ||
        !formData.subcategory
      ))
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
      let prevBalance = calculations.previous_balance;
      let wageAmount = Number(formData.wage);
      let newBalance = prevBalance + wageAmount;

      if (editingEntry) {
        // EDIT MODE
       // const wageDiff = wageAmount - Number(editingEntry.amount_paid);

        // 1. Update the entry
        await supabase.from('daily_entries').update({
          ...editingEntry,
          entry_date: formData.entry_date,
          amount_paid: wageAmount,
          previous_balance: prevBalance,
          new_balance: newBalance,
          notes: formData.notes,
          attendance_status: formData.attendance_status,
          work_type: formData.work_type,
          category: formData.category,
          subcategory: formData.subcategory,
        }).eq('id', editingEntry.id);

        // 2. Update balances for all subsequent entries
        const { data: subsequentEntries } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('labour_id', editingEntry.labour_id)
          .gt('entry_date', formData.entry_date)
          .order('entry_date', { ascending: true });

        let balance = newBalance;
        for (const subEntry of subsequentEntries || []) {
          balance += Number(subEntry.amount_paid || 0);
          await supabase.from('daily_entries').update({
            previous_balance: balance - Number(subEntry.amount_paid || 0),
            new_balance: balance,
          }).eq('id', subEntry.id);
        }

        // 3. Update master balance
        await supabase.from('labour_master')
          .update({ balance })
          .eq('id', editingEntry.labour_id);

        toast.success('Entry updated!');
        setEditingEntry(null);
      } else {
        // ADD MODE (existing logic)
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

        const entry = {
          labour_id: formData.labour_id,
          entry_date: formData.entry_date,
          amount_paid: Number(formData.wage),
          previous_balance: Number(calculations.previous_balance),
          new_balance: Number(calculations.new_balance),
          notes: formData.notes,
          user_id: user.id,
          attendance_status: formData.attendance_status,
          work_type: formData.work_type,
          category: formData.category,
          subcategory: formData.subcategory,
        };
        const { error: entryError } = await supabase.from('daily_entries').insert([entry]);
        if (entryError) {
          toast.error('Failed to save entry: ' + entryError.message);
          setSaving(false);
          return;
        }

        const { error: masterError } = await supabase.from('labour_master')
          .update({ balance: newBalance })
          .eq('id', formData.labour_id);
        if (masterError) {
          toast.error('Failed to update master balance: ' + masterError.message);
          setSaving(false);
          return;
        }

        toast.success('Entry saved!');
        setFormData({
          labour_id: formData.labour_id, // keep current selection!
          entry_date: '',
          wage: '',
          notes: '',
          work_type: '',
          category: '',
          subcategory: '',
          attendance_status: 'present'
        });
        setCalculations({ previous_balance: 0, wage: 0, new_balance: 0 });
        fetchLabours();
      }
    } catch (err: any) {
      toast.error('Failed to save entry: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-100 text-center">Daily Entry</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Labour</label>
            <select
              value={formData.labour_id}
              onChange={e => setFormData({ ...formData, labour_id: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
              required
            >
              <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Labour</option>
              {labours.map(l => (
                <option key={l.id} value={l.id}>{l.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Date</label>
            <input
              type="date"
              value={formData.entry_date}
              onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Wage</label>
            <input
              type="number"
              value={formData.wage}
              onChange={e => setFormData({ ...formData, wage: e.target.value.replace(/^0+/, '') })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
              required={formData.attendance_status !== 'absent'}
              disabled={formData.attendance_status === 'absent'}
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Type of Work</label>
            <select
              value={formData.work_type}
              onChange={e => setFormData({ ...formData, work_type: e.target.value, category: '', subcategory: '' })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
              required={formData.attendance_status !== 'absent'}
              disabled={formData.attendance_status === 'absent'}
            >
              <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Work Type</option>
              {workTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
              required={formData.attendance_status !== 'absent'}
              disabled={formData.attendance_status === 'absent'}
            >
              <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Subcategory</label>
            <select
              value={formData.subcategory}
              onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
              required={formData.attendance_status !== 'absent'}
              disabled={formData.attendance_status === 'absent'}
            >
              <option value="" disabled className="text-gray-400 dark:text-gray-500">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all py-2 px-3"
              placeholder="Optional notes"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Attendance</label>
            <select
              value={formData.attendance_status}
              onChange={e => setFormData({ ...formData, attendance_status: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none py-2 px-3"
              required
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half day">Half Day</option>
            </select>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex flex-col gap-1 text-gray-900 dark:text-gray-100 mt-2">
          <div>
            <span className="font-medium">Previous Balance:</span>{' '}
            <span className="font-semibold">₹{calculations.previous_balance}</span>
          </div>
          <div>
            <span className="font-medium">Today's Wage:</span>{' '}
            <span className="font-semibold">₹{calculations.wage}</span>
          </div>
          <div>
            <span className="font-medium">New Balance:</span>{' '}
            <span className="font-semibold">₹{calculations.new_balance}</span>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 py-3 z-10">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold py-3 rounded-lg shadow transition-colors disabled:opacity-50 text-lg"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-2">Daily Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-2">Date</th>
                <th className="p-2">Wage</th>
                <th className="p-2">Type</th>
                <th className="p-2">Category</th>
                <th className="p-2">Subcategory</th>
                <th className="p-2">Attendance</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td className="p-2">{entry.entry_date}</td>
                  <td className="p-2">{entry.amount_paid}</td>
                  <td className="p-2">{entry.work_type}</td>
                  <td className="p-2">{entry.category}</td>
                  <td className="p-2">{entry.subcategory}</td>
                  <td className="p-2">{entry.attendance_status}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                      onClick={() => handleEditEntry(entry)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => handleDeleteEntry(entry)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-4">No entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};