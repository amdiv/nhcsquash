exports.handler = async function(event, context) {
  const SHOWCASE = '12314886';
  const TOKEN    = process.env.VIMEO_TOKEN;

  if (!TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'VIMEO_TOKEN environment variable not set.' })
    };
  }

  const url = `https://api.vimeo.com/albums/${SHOWCASE}/videos?per_page=25&fields=uri,name,duration,pictures`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `bearer ${TOKEN}` }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Vimeo API returned ${response.status}` })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // cache for 5 minutes
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
