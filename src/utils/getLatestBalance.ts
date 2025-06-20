import { supabase } from '../lib/supabase';

export async function getLatestBalance(labourId: string, userId: string) {
  const { data: ledgerRow } = await supabase
    .from('balance_ledger')
    .select('balance_after')
    .eq('labour_id', labourId)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ledgerRow && ledgerRow.balance_after !== null && ledgerRow.balance_after !== undefined) {
    return Number(ledgerRow.balance_after);
  }
  // fallback to master if no ledger entry
  const { data: labour } = await supabase
    .from('labour_master')
    .select('balance')
    .eq('id', labourId)
    .eq('user_id', userId)
    .single();
  return labour && labour.balance ? Number(labour.balance) : 0;
}