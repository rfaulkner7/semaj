// Netlify Function: create-post
// Appends a new post to posts/posts.json in the GitHub repo using GitHub API.
// Requires environment variables: GITHUB_TOKEN, GITHUB_REPO (e.g. rfaulkner7/semaj)
// Caution: This is a simple approach; consider validation/rate limiting.

// Using built-in fetch (Node 18+ on Netlify). No external dependency needed.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const allowPublic = (process.env.ALLOW_PUBLIC_POSTS || '').toLowerCase() === 'true';
  if(!allowPublic){
    return { statusCode: 403, body: JSON.stringify({ error: 'Public posting disabled' }) };
  }

  const sharedSecret = process.env.POST_SHARED_SECRET;
  if(sharedSecret){
    try {
      const payload = JSON.parse(event.body || '{}');
      if(payload.secret !== sharedSecret){
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid secret' }) };
      }
    } catch(e){
      return { statusCode:400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // owner/repo
  if(!token || !repo){
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing GITHUB_TOKEN or GITHUB_REPO' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e){
    return { statusCode:400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const required = ['title','author','summary'];
  for(const k of required){
    if(!body[k] || String(body[k]).trim() === ''){
      return { statusCode:400, body: JSON.stringify({ error: `Missing field: ${k}` }) };
    }
  }

  // Basic sanitization
  const sanitize = (s) => s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/on\w+="[^"]*"/gi,'');

  const newPost = {
    title: sanitize(String(body.title).trim().slice(0,120)),
    date: body.date || new Date().toISOString(),
    author: sanitize(String(body.author).trim().slice(0,60)),
    tag: sanitize((body.tag || 'general').trim().slice(0,30)),
    summary: sanitize(String(body.summary).trim().slice(0,300)),
    body: body.body ? sanitize(String(body.body).trim().slice(0,5000)) : undefined,
    image: body.image && /^data:image\//.test(body.image) ? body.image.slice(0, 750000) : undefined // cap size ~750KB
  };

  try {
    // 1. Get current posts file (to append)
    const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/posts/posts.json`, {
      headers:{ 'Authorization': `token ${token}`, 'Accept':'application/vnd.github.v3+json' }
    });
    if(!fileRes.ok){
      const txt = await fileRes.text();
      throw new Error('Failed to fetch posts.json: ' + txt);
    }
    const fileJson = await fileRes.json();
    const sha = fileJson.sha;
    // Decode base64 content
    const existingContent = Buffer.from(fileJson.content, 'base64').toString('utf8');
    let posts = [];
    try { posts = JSON.parse(existingContent); } catch(e){ posts = []; }
    if(!Array.isArray(posts)) posts = [];
    posts.unshift(newPost); // add newest at start
    const updated = JSON.stringify(posts, null, 2);
    const b64 = Buffer.from(updated, 'utf8').toString('base64');

    // 2. Commit update
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/contents/posts/posts.json`, {
      method:'PUT',
      headers:{ 'Authorization': `token ${token}`, 'Accept':'application/vnd.github.v3+json' },
      body: JSON.stringify({
        message: `Add post: ${newPost.title}`,
        content: b64,
        sha
      })
    });
    if(!commitRes.ok){
      const t = await commitRes.text();
      throw new Error('Commit failed: ' + t);
    }

    return { statusCode: 200, body: JSON.stringify({ ok:true, post:newPost }) };
  } catch (err){
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};