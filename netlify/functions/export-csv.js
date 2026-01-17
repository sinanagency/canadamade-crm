const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://iaabsenvpwyqakvkypeq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWJzZW52cHd5cWFrdmt5cGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMzI4OCwiZXhwIjoyMDgzMTg5Mjg4fQ.a_3n4PEcrqR4mDNTzDC5Pn2eDu0leUAus3dW4YxtQzU'
);

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get query params for filtering
    const params = event.queryStringParameters || {};
    const { country, interest, verified, date_from, date_to, format } = params;

    // Build query
    let query = supabase.from('leads').select('*');

    if (country) {
      query = query.ilike('country', `%${country}%`);
    }
    if (interest) {
      query = query.eq('interest', interest);
    }
    if (verified === 'true') {
      query = query.eq('verified', true);
    }
    if (date_from) {
      query = query.gte('created_at', `${date_from}T00:00:00`);
    }
    if (date_to) {
      query = query.lte('created_at', `${date_to}T23:59:59`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: leads, error } = await query;

    if (error) throw error;

    // If JSON format requested
    if (format === 'json') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, count: leads.length, data: leads }),
      };
    }

    // Generate CSV
    const csvHeaders = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'WhatsApp',
      'Company',
      'Job Title',
      'Country',
      'Interest',
      'Flavor',
      'Verified',
      'Collected',
      'Created At'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = leads.map(lead => [
      lead.id,
      lead.first_name,
      lead.last_name || '',
      lead.email,
      lead.phone || '',
      lead.whatsapp_number || '',
      lead.company || '',
      lead.job_title || '',
      lead.country || '',
      lead.interest || '',
      lead.flavor || '',
      lead.verified ? 'Yes' : 'No',
      lead.booth_notified ? 'Yes' : 'No',
      new Date(lead.created_at).toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
    ].map(escapeCSV).join(','));

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    // Generate filename with date
    const filename = `canadamade_leads_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: csv,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
