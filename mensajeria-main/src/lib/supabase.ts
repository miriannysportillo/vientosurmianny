import { supabase as baseSupabase } from '../../../src/lib/supabase';

export const supabase = baseSupabase;

export const someFunction = async () => {
  const { data, error } = await supabase
    .from('some_table')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Data:', data);
  }
};