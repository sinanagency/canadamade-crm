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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Score each lead
    const scoredLeads = leads.map(lead => {
      let score = 0;
      let reasons = [];

      // Interest type scoring
      if (lead.interest === 'wholesale') {
        score += 40;
        reasons.push('Wholesale buyer');
      } else if (lead.interest === 'distributor') {
        score += 35;
        reasons.push('Distributor');
      } else if (lead.interest === 'retail') {
        score += 20;
        reasons.push('Retail');
      }

      // Verified = engaged
      if (lead.verified) {
        score += 25;
        reasons.push('Verified');
      }

      // Has company = B2B
      if (lead.company && lead.company.length > 2) {
        score += 15;
        reasons.push('Company provided');
      }

      // Job title signals decision maker
      const decisionTitles = ['ceo', 'owner', 'director', 'manager', 'buyer', 'procurement', 'purchasing', 'head'];
      if (lead.job_title && decisionTitles.some(t => lead.job_title.toLowerCase().includes(t))) {
        score += 20;
        reasons.push('Decision maker');
      }

      // GCC region = local market priority
      const gccCountries = ['uae', 'saudi', 'qatar', 'kuwait', 'bahrain', 'oman', 'dubai', 'abu dhabi'];
      if (lead.country && gccCountries.some(c => lead.country.toLowerCase().includes(c))) {
        score += 10;
        reasons.push('GCC region');
      }

      return {
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name || ''}`.trim(),
        company: lead.company || '-',
        job_title: lead.job_title || '-',
        country: lead.country || '-',
        interest: lead.interest || '-',
        email: lead.email || '-',
        phone: lead.phone || lead.whatsapp_number || '-',
        flavor: lead.flavor || '-',
        notes: lead.notes || '',
        verified: lead.verified,
        score,
        reasons,
        priority: score >= 70 ? 'HOT' : score >= 50 ? 'WARM' : 'NORMAL',
        created_at: lead.created_at
      };
    });

    // Sort by score
    const sorted = scoredLeads.sort((a, b) => b.score - a.score);

    const hot = sorted.filter(l => l.priority === 'HOT');
    const warm = sorted.filter(l => l.priority === 'WARM');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        summary: {
          total_leads: leads.length,
          hot_leads: hot.length,
          warm_leads: warm.length
        },
        hot_leads: hot.slice(0, 20),
        warm_leads: warm.slice(0, 20),
        all_scored: sorted.slice(0, 50)
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
