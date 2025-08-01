const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Handle preflight request (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const { eventCode, config } = JSON.parse(event.body);

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GIST_ID = process.env.GIST_ID;
  const filename = `${eventCode}-config.json`;

  const payload = {
    files: {
      [filename]: {
        content: JSON.stringify(config, null, 2)
      }
    }
  };

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${GITHUB_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json();

  return {
    statusCode: res.status,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  };
};
