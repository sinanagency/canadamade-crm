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
      .select('interest, verified, company, job_title, country');

    if (error) throw error;

    // Count by interest type
    const interestCounts = {};
    const interestDetails = {};

    leads.forEach(lead => {
      const interest = lead.interest || 'unspecified';

      if (!interestCounts[interest]) {
        interestCounts[interest] = { total: 0, verified: 0 };
        interestDetails[interest] = [];
      }

      interestCounts[interest].total++;
      if (lead.verified) interestCounts[interest].verified++;

      // Store company info for wholesale leads
      if (interest === 'wholesale' && lead.company) {
        interestDetails[interest].push({
          company: lead.company,
          job_title: lead.job_title,
          country: lead.country,
          verified: lead.verified
        });
      }
    });

    // Format breakdown
    const breakdown = Object.entries(interestCounts)
      .map(([interest, stats]) => ({
        interest,
        count: stats.total,
        verified: stats.verified,
        percentage: ((stats.total / leads.length) * 100).toFixed(1) + '%',
        verification_rate: ((stats.verified / stats.total) * 100).toFixed(1) + '%'
      }))
      .sort((a, b) => b.count - a.count);

    // Priority order for business
    const priorityOrder = { wholesale: 1, distributor: 2, retail: 3, personal: 4, unspecified: 5 };
    const prioritized = [...breakdown].sort((a, b) =>
      (priorityOrder[a.interest] || 99) - (priorityOrder[b.interest] || 99)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_leads: leads.length,
        breakdown,
        by_priority: prioritized,
        wholesale_companies: interestDetails.wholesale || []
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
