// netlify/functions/whatsapp-webhook.js
// Receives incoming WhatsApp messages and adds notes to matching leads

const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://iaabsenvpwyqakvkypeq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWJzZW52cHd5cWFrdmt5cGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMzI4OCwiZXhwIjoyMDgzMTg5Mjg4fQ.a_3n4PEcrqR4mDNTzDC5Pn2eDu0leUAus3dW4YxtQzU'
);

// Authorized phone numbers that can add notes (without + prefix, digits only)
const AUTHORIZED_NUMBERS = [
  '971501168462',  // Taona
  '16476480066',   // Naheed
  '16472349575',   // Nadim
];

function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

exports.handler = async (event) => {
  // Handle webhook verification (GET request)
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    // WhatsApp webhook verification
    if (params['hub.verify_token'] === 'canadamade2026') {
      return {
        statusCode: 200,
        headers,
        body: params['hub.challenge'] || 'verified',
      };
    }
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('Webhook received:', JSON.stringify(payload));

    // Handle different webhook formats (Meta/sev7enmarketing)
    let senderPhone = '';
    let messageText = '';

    // Meta WhatsApp Business API format
    if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = payload.entry[0].changes[0].value.messages[0];
      senderPhone = msg.from;
      messageText = msg.text?.body || '';
    }
    // sev7enmarketing format (adjust based on actual format)
    else if (payload.from || payload.phone_number || payload.sender) {
      senderPhone = payload.from || payload.phone_number || payload.sender;
      messageText = payload.message || payload.text || payload.body || payload.message_body || '';
    }
    // Direct format
    else if (payload.sender_phone && payload.message) {
      senderPhone = payload.sender_phone;
      messageText = payload.message;
    }

    if (!senderPhone || !messageText) {
      console.log('No sender or message found in payload');
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'ignored' }) };
    }

    const cleanedSender = cleanPhone(senderPhone);
    console.log('Sender:', cleanedSender, 'Message:', messageText);

    // Check if sender is authorized
    if (!AUTHORIZED_NUMBERS.includes(cleanedSender)) {
      console.log('Unauthorized sender:', cleanedSender);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'unauthorized' }) };
    }

    // Parse message: expected format "FirstName: note text" or "FirstName LastName: note text"
    const colonIndex = messageText.indexOf(':');
    if (colonIndex === -1) {
      console.log('No colon found in message, cannot parse name');
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'no_name_format' }) };
    }

    const namePart = messageText.substring(0, colonIndex).trim();
    const notePart = messageText.substring(colonIndex + 1).trim();

    if (!namePart || !notePart) {
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'empty_name_or_note' }) };
    }

    // Search for lead by first name (case insensitive)
    const { data: leads, error: searchError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, notes')
      .ilike('first_name', `%${namePart.split(' ')[0]}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (searchError) {
      console.error('Search error:', searchError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: searchError.message }) };
    }

    if (!leads || leads.length === 0) {
      console.log('No lead found for name:', namePart);
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, action: 'no_lead_found', searched: namePart }) };
    }

    // Find best match (check if last name also matches if provided)
    let matchedLead = leads[0];
    const nameParts = namePart.toLowerCase().split(' ');
    if (nameParts.length > 1) {
      const lastNameSearch = nameParts.slice(1).join(' ');
      const betterMatch = leads.find(l =>
        l.last_name && l.last_name.toLowerCase().includes(lastNameSearch)
      );
      if (betterMatch) matchedLead = betterMatch;
    }

    // Append note with timestamp and sender info
    const timestamp = new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' });
    const senderName = cleanedSender === '971501168462' ? 'Taona' :
                       cleanedSender === '16476480066' ? 'Naheed' :
                       cleanedSender === '16472349575' ? 'Nadim' : 'Staff';

    const newNote = `[${timestamp} via ${senderName}] ${notePart}`;
    const updatedNotes = matchedLead.notes
      ? `${matchedLead.notes}\n${newNote}`
      : newNote;

    // Update lead notes
    const { error: updateError } = await supabase
      .from('leads')
      .update({ notes: updatedNotes })
      .eq('id', matchedLead.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: updateError.message }) };
    }

    console.log('Note added to lead:', matchedLead.first_name, matchedLead.last_name);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        action: 'note_added',
        lead: `${matchedLead.first_name} ${matchedLead.last_name || ''}`,
        note: notePart
      }),
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
