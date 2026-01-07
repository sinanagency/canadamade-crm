import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://iaabsenvpwyqakvkypeq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWJzZW52cHd5cWFrdmt5cGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMzI4OCwiZXhwIjoyMDgzMTg5Mjg4fQ.a_3n4PEcrqR4mDNTzDC5Pn2eDu0leUAus3dW4YxtQzU'
);

// Test insert into leads
const { data, error } = await supabase.from('leads').insert({
  first_name: 'Test',
  last_name: 'User',
  flavor: 'Barbeque'
}).select();

console.log('Result:', data, error);
