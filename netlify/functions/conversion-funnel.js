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
      .select('verified, booth_notified, comm_preference');

    if (error) throw error;

    const total = leads.length;
    const verified = leads.filter(l => l.verified).length;
    const collected = leads.filter(l => l.booth_notified).length;

    // By communication preference
    const byComm = {};
    leads.forEach(lead => {
      const comm = lead.comm_preference || 'unknown';
      if (!byComm[comm]) {
        byComm[comm] = { total: 0, verified: 0, collected: 0 };
      }
      byComm[comm].total++;
      if (lead.verified) byComm[comm].verified++;
      if (lead.booth_notified) byComm[comm].collected++;
    });

    const commBreakdown = Object.entries(byComm).map(([method, stats]) => ({
      method,
      ...stats,
      verification_rate: stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) + '%' : '0%',
      collection_rate: stats.verified > 0 ? ((stats.collected / stats.verified) * 100).toFixed(1) + '%' : '0%'
    }));

    const funnel = {
      stage_1_registered: {
        count: total,
        percentage: '100%',
        label: 'Scanned QR / Registered'
      },
      stage_2_verified: {
        count: verified,
        percentage: total > 0 ? ((verified / total) * 100).toFixed(1) + '%' : '0%',
        drop_off: total - verified,
        label: 'Verified (Email/WhatsApp/SMS)'
      },
      stage_3_collected: {
        count: collected,
        percentage: verified > 0 ? ((collected / verified) * 100).toFixed(1) + '%' : '0%',
        drop_off: verified - collected,
        label: 'Collected Sample'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        funnel,
        overall_conversion: total > 0 ? ((collected / total) * 100).toFixed(1) + '%' : '0%',
        by_verification_method: commBreakdown,
        insights: {
          pending_verification: total - verified,
          pending_collection: verified - collected,
          best_channel: commBreakdown.sort((a, b) =>
            parseFloat(b.verification_rate) - parseFloat(a.verification_rate)
          )[0]?.method || 'N/A'
        }
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
