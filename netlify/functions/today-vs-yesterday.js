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
    // Get today and yesterday dates (Dubai timezone UTC+4)
    const now = new Date();
    const dubaiOffset = 4 * 60 * 60 * 1000;
    const dubaiNow = new Date(now.getTime() + dubaiOffset);

    const today = dubaiNow.toISOString().split('T')[0];
    const yesterday = new Date(dubaiNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all leads from yesterday and today
    const { data: leads, error } = await supabase
      .from('leads')
      .select('created_at, verified, booth_notified, interest')
      .gte('created_at', `${yesterday}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    if (error) throw error;

    // Split by day
    const todayLeads = leads.filter(l => l.created_at.startsWith(today));
    const yesterdayLeads = leads.filter(l => l.created_at.startsWith(yesterday));

    const calcStats = (data) => ({
      total: data.length,
      verified: data.filter(l => l.verified).length,
      collected: data.filter(l => l.booth_notified).length,
      wholesale: data.filter(l => l.interest === 'wholesale').length
    });

    const todayStats = calcStats(todayLeads);
    const yesterdayStats = calcStats(yesterdayLeads);

    const calcChange = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? '+100%' : '0%';
      const change = ((today - yesterday) / yesterday) * 100;
      return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
    };

    const comparison = {
      leads: {
        today: todayStats.total,
        yesterday: yesterdayStats.total,
        change: calcChange(todayStats.total, yesterdayStats.total)
      },
      verified: {
        today: todayStats.verified,
        yesterday: yesterdayStats.verified,
        change: calcChange(todayStats.verified, yesterdayStats.verified)
      },
      collected: {
        today: todayStats.collected,
        yesterday: yesterdayStats.collected,
        change: calcChange(todayStats.collected, yesterdayStats.collected)
      },
      wholesale: {
        today: todayStats.wholesale,
        yesterday: yesterdayStats.wholesale,
        change: calcChange(todayStats.wholesale, yesterdayStats.wholesale)
      }
    };

    // Performance indicator
    const performance = todayStats.total >= yesterdayStats.total ? 'UP' :
                        todayStats.total >= yesterdayStats.total * 0.8 ? 'STABLE' : 'DOWN';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dates: { today, yesterday },
        today: todayStats,
        yesterday: yesterdayStats,
        comparison,
        performance,
        insight: performance === 'UP' ?
          `Great day! ${comparison.leads.change} more leads than yesterday.` :
          performance === 'STABLE' ?
          'Steady performance, on track with yesterday.' :
          `Slower day. Consider booth engagement strategies.`
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
