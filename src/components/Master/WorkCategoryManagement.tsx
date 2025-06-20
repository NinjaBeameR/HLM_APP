import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface WorkCategoryRow {
  id: string;
  category: string;
  subcategory: string;
}

export const WorkCategoryManagement: React.FC = () => {
  const [rows, setRows] = useState<WorkCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const getUserAndRows = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to manage categories.');
        setLoading(false);
        return;
      }
      setUserId(user.id);
      fetchRows(user.id);
    };
    getUserAndRows();
    // eslint-disable-next-line
  }, []);

  const fetchRows = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('work_category')
      .select('id, category, subcategory')
      .eq('is_active', true)
      .eq('user_id', uid);

    setRows((data || []) as WorkCategoryRow[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!userId) {
      toast.error('You must be logged in to add.');
      return;
    }
    const cat = newCategory.trim();
    const sub = newSubcategory.trim();
    if (!cat || !sub) {
      toast.error('Both fields are required');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('work_category').insert([
      {
        category: cat,
        subcategory: sub,
        is_active: true,
        user_id: userId,
      }
    ]);
    setAdding(false);
    if (error) {
      toast.error('Failed to add');
    } else {
      toast.success('Added!');
      setNewCategory('');
      setNewSubcategory('');
      fetchRows(userId);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('work_category')
      .update({ is_active: false })
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted!');
      fetchRows(userId!);
    }
  };

  // Unique categories for grouped list
  const categoryOptions = Array.from(new Set(rows.map(r => r.category))).sort();

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Work Category Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          View, add, and delete categories and subcategories.
        </p>
      </div>

      {/* Add New Category/Subcategory */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add New Category/Subcategory
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-100 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Category"
              className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-100 mb-1">
              Subcategory Name
            </label>
            <input
              type="text"
              value={newSubcategory}
              onChange={e => setNewSubcategory(e.target.value)}
              placeholder="Subcategory"
              className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-xs"
            />
          </div>
          <button
            type="button"
            disabled={adding}
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-xs"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Grouped Categories & Subcategories */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 max-h-[400px] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Existing Categories & Subcategories
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No categories found.</div>
        ) : (
          <ul className="space-y-2">
            {categoryOptions.map(cat => {
              const subs = rows
                .filter(r => r.category === cat)
                .map(r => ({ id: r.id, subcategory: r.subcategory }));
              return (
                <li key={cat}>
                  <div className="font-bold text-blue-700 dark:text-blue-300 mb-1">{cat}</div>
                  <ul className="ml-4 list-disc">
                    {subs.map(sub => (
                      <li key={sub.id} className="flex items-center justify-between">
                        <span>{sub.subcategory}</span>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded ml-2"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};