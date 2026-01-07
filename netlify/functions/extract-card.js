// netlify/functions/extract-card.js
// AI-powered business card extraction using Claude

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { image } = JSON.parse(event.body);
    
    if (!image) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'No image provided' }) 
      };
    }

    // Extract media type and base64 data from data URL
    let mediaType = 'image/jpeg'; // default
    let base64Data = image;

    // Check if it's a data URL and extract media type
    const dataUrlMatch = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (dataUrlMatch) {
      mediaType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    } else {
      // If no data URL prefix, just use the raw base64
      base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Extract contact information from this business card image. Return ONLY a JSON object with these fields (use null for any field you cannot find):

{
  "first_name": "string or null",
  "last_name": "string or null", 
  "company": "string or null",
  "job_title": "string or null",
  "email": "string or null",
  "phone": "string or null"
}

Rules:
- Extract exactly what you see, don't guess
- For names, separate first and last name properly
- Include country code for phone if visible
- Return ONLY the JSON, no other text`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI extraction failed', details: errorText })
      };
    }

    const result = await response.json();
    const aiResponse = result.content[0].text;
    
    // Parse the JSON response from Claude
    let extracted;
    try {
      // Handle case where Claude might wrap in markdown code blocks
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', aiResponse);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Could not parse extraction',
          raw: aiResponse 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: extracted
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
};
