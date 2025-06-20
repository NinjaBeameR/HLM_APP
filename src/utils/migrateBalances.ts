// Run this as a script or in an admin-only button
import { supabase } from '../lib/supabase';

async function recalcAllLabourBalances() {
  const { data: labours } = await supabase.from('labour_master').select('id, balance');
  for (const labour of labours ?? []) {
    const { data: entriesRaw } = await supabase.from('daily_entries').select('*').eq('labour_id', labour.id);
    const { data: paymentsRaw } = await supabase.from('payments').select('*').eq('labour_id', labour.id);
    const entries = entriesRaw ?? [];
    const payments = paymentsRaw ?? [];
    const combined = [
      ...entries.map((e: any) => ({ ...e, type: 'entry' })),
      ...payments.map((p: any) => ({ ...p, type: 'payment' })),
    ].sort((a, b) => {
      const dateA = new Date(a.entry_date || a.date).getTime();
      const dateB = new Date(b.entry_date || b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      if (a.type === b.type) return 0;
      return a.type === 'entry' ? -1 : 1;
    });
    let runningBalance = Number(labour.balance) || 0;
    for (const item of combined) {
      if (item.type === 'entry') {
        const prevBalance = runningBalance;
        runningBalance += Number(item.amount_paid) || 0;
        await supabase.from('daily_entries').update({
          previous_balance: prevBalance,
          new_balance: runningBalance,
        }).eq('id', item.id);
      } else if (item.type === 'payment') {
        runningBalance -= Number(item.amount) || 0;
      }
    }
  }
  console.log('Migration complete!');
}
recalcAllLabourBalances();