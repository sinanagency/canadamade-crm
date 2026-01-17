const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://iaabsenvpwyqakvkypeq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWJzZW52cHd5cWFrdmt5cGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMzI4OCwiZXhwIjoyMDgzMTg5Mjg4fQ.a_3n4PEcrqR4mDNTzDC5Pn2eDu0leUAus3dW4YxtQzU'
);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('flavor');

    if (error) throw error;

    // Count flavors
    const flavorCounts = {};
    leads.forEach(lead => {
      const flavor = lead.flavor || 'Unknown';
      flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
    });

    // Sort by count descending
    const rankings = Object.entries(flavorCounts)
      .map(([flavor, count]) => ({
        flavor,
        count,
        percentage: ((count / leads.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ rank: index + 1, ...item }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_leads: leads.length,
        rankings
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
