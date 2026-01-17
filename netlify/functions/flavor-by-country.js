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
      .select('flavor, country');

    if (error) throw error;

    // Group by country, then count flavors
    const countryFlavors = {};
    leads.forEach(lead => {
      const country = lead.country || 'Unknown';
      const flavor = lead.flavor || 'Unknown';

      if (!countryFlavors[country]) {
        countryFlavors[country] = { total: 0, flavors: {} };
      }
      countryFlavors[country].total++;
      countryFlavors[country].flavors[flavor] = (countryFlavors[country].flavors[flavor] || 0) + 1;
    });

    // Format output with top flavor per country
    const results = Object.entries(countryFlavors)
      .map(([country, data]) => {
        const flavorRanking = Object.entries(data.flavors)
          .sort((a, b) => b[1] - a[1])
          .map(([flavor, count]) => ({ flavor, count }));

        return {
          country,
          total_leads: data.total,
          top_flavor: flavorRanking[0]?.flavor || 'N/A',
          flavor_breakdown: flavorRanking
        };
      })
      .sort((a, b) => b.total_leads - a.total_leads);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_countries: results.length,
        data: results
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
