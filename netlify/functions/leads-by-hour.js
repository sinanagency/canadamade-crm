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
    // Get date filter from query params
    const params = event.queryStringParameters || {};
    const dateFilter = params.date; // YYYY-MM-DD format

    let query = supabase.from('leads').select('created_at');

    if (dateFilter) {
      query = query.gte('created_at', `${dateFilter}T00:00:00`)
                   .lt('created_at', `${dateFilter}T23:59:59`);
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    // Count by hour (Dubai timezone UTC+4)
    const hourCounts = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    leads.forEach(lead => {
      const date = new Date(lead.created_at);
      // Convert to Dubai time (UTC+4)
      const dubaiHour = (date.getUTCHours() + 4) % 24;
      hourCounts[dubaiHour]++;
    });

    // Format with labels
    const hourlyData = Object.entries(hourCounts).map(([hour, count]) => {
      const h = parseInt(hour);
      const label = h === 0 ? '12 AM' :
                    h < 12 ? `${h} AM` :
                    h === 12 ? '12 PM' :
                    `${h - 12} PM`;
      return { hour: h, label, count };
    });

    // Find peak hours
    const sorted = [...hourlyData].sort((a, b) => b.count - a.count);
    const peakHours = sorted.slice(0, 3).filter(h => h.count > 0);

    // Expo hours analysis (assuming 10 AM - 6 PM)
    const expoHours = hourlyData.filter(h => h.hour >= 10 && h.hour <= 18);
    const expoTotal = expoHours.reduce((sum, h) => sum + h.count, 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_leads: leads.length,
        timezone: 'Dubai (UTC+4)',
        hourly_breakdown: hourlyData,
        peak_hours: peakHours,
        expo_hours_total: expoTotal,
        recommendation: peakHours.length > 0 ?
          `Staff up during ${peakHours.map(h => h.label).join(', ')}` :
          'Not enough data for recommendations'
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
