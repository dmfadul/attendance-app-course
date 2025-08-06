const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK'
    };
  }

  try {
    const { eventCode, data } = JSON.parse(event.body);
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GIST_ID = process.env.GIST_ID;
    const filename = `${eventCode}.json`;

    // Step 1: Get current Gist content
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const gistData = await gistRes.json();
    let fileContent = gistData.files[filename]?.content;

    // Step 2: Parse existing content or initialize new array
    let contentArray = [];
    if (fileContent) {
      try {
        contentArray = JSON.parse(fileContent);
        if (!Array.isArray(contentArray)) contentArray = [];
      } catch (e) {
        contentArray = [];
      }
    }

    // Step 3: Append new data
    contentArray.push(data);

    // Step 4: Update the Gist with new content
    const payload = {
      files: {
        [filename]: {
          content: JSON.stringify(contentArray, null, 2)
        }
      }
    };

    const updateRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const updateResult = await updateRes.json();

    if (!updateRes.ok) {
      return {
        statusCode: updateRes.status,
        headers,
        body: JSON.stringify({ error: updateResult })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, filename })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
