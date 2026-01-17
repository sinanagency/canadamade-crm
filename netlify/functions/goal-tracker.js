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

// Configure goals here
const GOALS = {
  daily_leads: 100,
  daily_verified: 80,
  daily_wholesale: 20,
  total_leads: 1000,
  total_samples: 1000  // 5 flavors x 200 each
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get today's date (Dubai timezone)
    const now = new Date();
    const dubaiOffset = 4 * 60 * 60 * 1000;
    const dubaiNow = new Date(now.getTime() + dubaiOffset);
    const today = dubaiNow.toISOString().split('T')[0];

    // Fetch all leads
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('created_at, verified, booth_notified, interest');

    if (error) throw error;

    // Today's leads
    const todayLeads = allLeads.filter(l => l.created_at.startsWith(today));

    const stats = {
      daily: {
        leads: todayLeads.length,
        verified: todayLeads.filter(l => l.verified).length,
        wholesale: todayLeads.filter(l => l.interest === 'wholesale').length
      },
      total: {
        leads: allLeads.length,
        verified: allLeads.filter(l => l.verified).length,
        collected: allLeads.filter(l => l.booth_notified).length
      }
    };

    const calcProgress = (current, goal) => ({
      current,
      goal,
      percentage: Math.min(100, (current / goal) * 100).toFixed(1),
      remaining: Math.max(0, goal - current),
      achieved: current >= goal
    });

    const goals = {
      daily_leads: calcProgress(stats.daily.leads, GOALS.daily_leads),
      daily_verified: calcProgress(stats.daily.verified, GOALS.daily_verified),
      daily_wholesale: calcProgress(stats.daily.wholesale, GOALS.daily_wholesale),
      total_leads: calcProgress(stats.total.leads, GOALS.total_leads),
      samples_distributed: calcProgress(stats.total.collected, GOALS.total_samples)
    };

    // Overall progress
    const overallProgress = (
      parseFloat(goals.daily_leads.percentage) +
      parseFloat(goals.daily_verified.percentage) +
      parseFloat(goals.total_leads.percentage)
    ) / 3;

    // Time-based projection
    const hour = dubaiNow.getHours();
    const expoHoursRemaining = Math.max(0, 18 - hour); // Assuming expo ends at 6 PM
    const leadsPerHour = hour > 10 ? stats.daily.leads / (hour - 10) : 0;
    const projectedDaily = stats.daily.leads + (leadsPerHour * expoHoursRemaining);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        date: today,
        current_time: dubaiNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        goals,
        overall_progress: overallProgress.toFixed(1) + '%',
        projection: {
          leads_per_hour: leadsPerHour.toFixed(1),
          hours_remaining: expoHoursRemaining,
          projected_daily_total: Math.round(projectedDaily),
          will_hit_daily_goal: projectedDaily >= GOALS.daily_leads
        },
        motivation: goals.daily_leads.achieved ?
          'Daily goal achieved! Keep the momentum!' :
          `${goals.daily_leads.remaining} more leads to hit today's goal!`
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
