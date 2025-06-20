import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Labour {
  id: string;
  full_name: string;
  balance?: number | null;
}

function toCSV(rows: any[], headers: string[]) {
  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(',')),
  ];
  return csvRows.join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN');
}

export const SummaryDashboard: React.FC = () => {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const [selectedLabour, setSelectedLabour] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const fetchAll = async () => {
    const { data: laboursData } = await supabase.from('labour_master').select('id, full_name, balance').eq('is_active', true);
    setLabours(laboursData || []);
    const { data: entriesData } = await supabase.from('daily_entries').select('*');
    setDailyEntries(entriesData || []);
    const { data: paymentsData } = await supabase.from('payments').select('*');
    setPayments(paymentsData || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredLabours = selectedLabour
    ? labours.filter(l => l.id === selectedLabour)
    : labours;

  // Filter entries/payments by date range if set
  const filterByDate = (arr: any[]) => {
    return arr.filter(item => {
      const date = new Date(item.entry_date || item.date);
      if (fromDate && date < new Date(fromDate)) return false;
      if (toDate && date > new Date(toDate)) return false;
      return true;
    });
  };

  const getLabourSummary = (labourId: string) => {
    const entries = filterByDate(dailyEntries.filter((e: any) => e.labour_id === labourId));
    const pays = filterByDate(payments.filter((p: any) => p.labour_id === labourId));
    const totalWork = entries.reduce((sum: number, e: any) => sum + (Number(e.amount_paid) || 0), 0);
    const totalPaid = pays.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const balance = (labours.find(l => l.id === labourId)?.balance) || 0;
    return { totalWork, totalPaid, balance, entries, pays };
  };

  const exportDetailedReport = () => {
    const headers = [
      'Labour Name',
      'Date',
      'Entry Type',
      'Attendance',
      'Type of Work',
      'Category',
      'Subcategory',
      'Per Day Wage',
      'Wage Payable',
      'Payment',
      'Payment Mode',
      'Narration',
      'Running Balance'
    ];

    let rows: any[] = [];
    filteredLabours.forEach(labour => {
      const { entries, pays } = getLabourSummary(labour.id);
      // Combine and sort by date
      const combined = [
        ...entries.map((e: any) => ({
          type: 'Work' as const,
          date: e.entry_date,
          attendance: e.attendance_status,
          work_type: e.work_type,
          category: e.category,
          subcategory: e.subcategory,
          wage: e.amount_paid,
          notes: e.notes,
        })),
        ...pays.map((p: any) => ({
          type: 'Payment' as const,
          date: p.date,
          payment: p.amount,
          mode: p.mode,
          narration: p.narration,
        })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Start with opening balance
      let runningBalance = 0; // or use opening balance if you have one

      combined.forEach(row => {
        if (row.type === 'Work') {
          runningBalance += Number(row.wage) || 0;
          rows.push({
            'Labour Name': labour.full_name,
            'Date': formatDate(row.date),
            'Entry Type': row.type,
            'Attendance': row.attendance || '',
            'Type of Work': row.work_type || '',
            'Category': row.category || '',
            'Subcategory': row.subcategory || '',
            'Per Day Wage': row.wage || '',
            'Wage Payable': row.wage || '',
            'Payment': '',
            'Payment Mode': '',
            'Narration': row.notes || '',
            'Running Balance': runningBalance
          });
        } else if (row.type === 'Payment') {
          runningBalance -= Number(row.payment) || 0;
          rows.push({
            'Labour Name': labour.full_name,
            'Date': formatDate(row.date),
            'Entry Type': row.type,
            'Attendance': '',
            'Type of Work': '',
            'Category': '',
            'Subcategory': '',
            'Per Day Wage': '',
            'Wage Payable': '',
            'Payment': row.payment || '',
            'Payment Mode': row.mode || '',
            'Narration': row.narration || '',
            'Running Balance': runningBalance
          });
        }
      });
    });
    const csv = toCSV(rows, headers);
    downloadCSV(csv, 'detailed_report.csv');
    setShowExportModal(false);
  };

  const exportShortSummary = () => {
    const headers = [
      'Labour Name',
      'Days Worked',
      'Days Present',
      'Total Wage',
      'Total Payment',
      'Balance Payable',
      'Type of Work'
    ];
    const rows = filteredLabours.map((labour) => {
      const entries = filterByDate(dailyEntries.filter((e: any) => e.labour_id === labour.id));
      const pays = filterByDate(payments.filter((p: any) => p.labour_id === labour.id));
      const totalWage = entries.reduce((sum: number, e: any) => sum + (Number(e.amount_paid) || 0), 0);
      const totalPayment = pays.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const balance = (labours.find(l => l.id === labour.id)?.balance) || 0;
      const daysWorked = entries.length;
      const daysPresent = entries.filter((e: any) => e.attendance_status === 'present').length;
      // For Type of Work, you can join all unique types
      const workTypes = Array.from(new Set(entries.map((e: any) => e.work_type).filter(Boolean))).join(', ');
      return {
        'Labour Name': labour.full_name,
        'Days Worked': daysWorked,
        'Days Present': daysPresent,
        'Total Wage': totalWage || '',
        'Total Payment': totalPayment || '',
        'Balance Payable': balance || '',
        'Type of Work': workTypes
      };
    });
    const csv = toCSV(rows, headers);
    downloadCSV(csv, 'short_summary.csv');
    setShowExportModal(false);
  };

  const handleBackup = () => {
    alert('Backup feature coming soon!');
  };

  const handleImport = () => {
    alert('Import feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-200">Summary Dashboard</h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400"
            value={selectedLabour}
            onChange={e => setSelectedLabour(e.target.value)}
          >
            <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Labours</option>
            {labours.map(l => (
              <option key={l.id} value={l.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {l.full_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-400"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            onClick={() => {
              setSelectedLabour('');
              setFromDate('');
              setToDate('');
            }}
            type="button"
          >
            Clear All Filters
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => setShowExportModal(true)}>Export Data</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleBackup}>Backup Data</button>
          <input type="file" accept="application/json" style={{ display: 'none' }} id="import-json" onChange={handleImport} />
          <label htmlFor="import-json" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 cursor-pointer">Import Data</label>
        </div>

        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-8 w-full max-w-xs text-center">
              <h3 className="text-lg font-semibold mb-4">Export Data</h3>
              <button className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={exportDetailedReport}>Detailed Report</button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={exportShortSummary}>Short Summary</button>
              <button className="mt-4 text-gray-500 hover:text-gray-700 text-sm" onClick={() => setShowExportModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow divide-y">
          {!labours.length && (
            <div className="p-4 text-gray-500">No data found. Please check your filters or add new data.</div>
          )}
          {filteredLabours.map(labour => {
            const summary = getLabourSummary(labour.id);
            const computedBalance = summary.totalWork - summary.totalPaid;
            return (
              <div key={labour.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{labour.full_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Work: ₹{summary.totalWork.toFixed(2)} | Paid: ₹{summary.totalPaid.toFixed(2)}
                  </div>
                </div>
                <div className={`font-bold ${computedBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Balance: ₹{computedBalance.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
