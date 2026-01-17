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
      .select('country, verified, interest');

    if (error) throw error;

    // Count by country
    const countryCounts = {};
    leads.forEach(lead => {
      const country = lead.country || 'Unknown';
      if (!countryCounts[country]) {
        countryCounts[country] = { total: 0, verified: 0, wholesale: 0, retail: 0 };
      }
      countryCounts[country].total++;
      if (lead.verified) countryCounts[country].verified++;
      if (lead.interest === 'wholesale') countryCounts[country].wholesale++;
      if (lead.interest === 'retail') countryCounts[country].retail++;
    });

    // Sort and rank
    const rankings = Object.entries(countryCounts)
      .map(([country, stats]) => ({
        country,
        ...stats,
        verification_rate: ((stats.verified / stats.total) * 100).toFixed(1) + '%'
      }))
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({ rank: index + 1, ...item }));

    // Regional grouping
    const regions = {
      gcc: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
      mena: ['Egypt', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia'],
      asia: ['India', 'Pakistan', 'China', 'Japan', 'Singapore', 'Malaysia'],
      americas: ['USA', 'Canada', 'Mexico', 'Brazil'],
      europe: ['UK', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands']
    };

    const regionalStats = {};
    Object.entries(regions).forEach(([region, countries]) => {
      regionalStats[region] = rankings
        .filter(r => countries.some(c => r.country.toLowerCase().includes(c.toLowerCase())))
        .reduce((sum, r) => sum + r.total, 0);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_leads: leads.length,
        total_countries: rankings.length,
        rankings,
        regional_summary: regionalStats
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
