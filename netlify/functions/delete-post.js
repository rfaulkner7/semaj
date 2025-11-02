// Netlify Function: delete-post
// Deletes a post from posts/posts.json by id (preferred) or fallback title+date match.
// Requires same env vars as create-post plus optional POST_SHARED_SECRET.

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST'){
    return { statusCode:405, body: JSON.stringify({ error:'Method not allowed' }) };
  }

  const allowPublic = (process.env.ALLOW_PUBLIC_POSTS || '').toLowerCase() === 'true';
  // Deletion should generally be protected; require secret unless explicitly allowed.
  const secret = process.env.POST_SHARED_SECRET;
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch(e){
    return { statusCode:400, body: JSON.stringify({ error:'Invalid JSON' }) };
  }
  if(secret && payload.secret !== secret){
    return { statusCode:401, body: JSON.stringify({ error:'Invalid secret' }) };
  }
  // Optional: if no secret defined, only proceed if allowPublic true.
  if(!secret && !allowPublic){
    return { statusCode:403, body: JSON.stringify({ error:'Deletion disabled' }) };
  }

  const debug = (process.env.DEBUG_POSTS || '').toLowerCase() === 'true';
  const token = process.env.GITHUB_TOKEN || process.env.github_token || process.env.Github_Token;
  const repo = process.env.GITHUB_REPO || process.env.github_repo || process.env.Github_Repo;
  if(!token || !repo){
    return { statusCode:500, body: JSON.stringify({ error:'Server misconfigured: missing GITHUB_TOKEN or GITHUB_REPO' }) };
  }

  const targetId = payload.id;
  const fallbackTitle = payload.title;
  const fallbackDate = payload.date;
  if(!targetId && (!fallbackTitle || !fallbackDate)){
    return { statusCode:400, body: JSON.stringify({ error:'Provide id or title+date' }) };
  }

  try {
    const authHeader = `token ${token}`;
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/posts/posts.json`, {
      headers:{ 'Authorization': authHeader, 'Accept':'application/vnd.github.v3+json' }
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error('Fetch failed: ' + txt);
    }
    const json = await res.json();
    const sha = json.sha;
    const existingContent = Buffer.from(json.content, 'base64').toString('utf8');
    let posts = [];
    try { posts = JSON.parse(existingContent); } catch(e){ posts = []; }
    if(!Array.isArray(posts)) posts = [];

    const originalCount = posts.length;
    posts = posts.filter(p => {
      if(targetId){
        return p.id !== targetId;
      } else {
        return !(p.title === fallbackTitle && p.date === fallbackDate);
      }
    });

    if(posts.length === originalCount){
      return { statusCode:404, body: JSON.stringify({ error:'Post not found' }) };
    }

    const updated = JSON.stringify(posts, null, 2);
    const b64 = Buffer.from(updated, 'utf8').toString('base64');
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/contents/posts/posts.json`, {
      method:'PUT',
      headers:{ 'Authorization': authHeader, 'Accept':'application/vnd.github.v3+json' },
      body: JSON.stringify({
        message: `Delete post ${targetId || fallbackTitle}`,
        content: b64,
        sha
      })
    });
    if(!commitRes.ok){
      const t = await commitRes.text();
      throw new Error('Commit failed: ' + t);
    }

    return { statusCode:200, body: JSON.stringify({ ok:true, deleted: targetId || `${fallbackTitle}@${fallbackDate}` }) };
  } catch(err){
    return { statusCode:500, body: JSON.stringify({ error: err.message, debug: debug ? { targetId, fallbackTitle, fallbackDate } : undefined }) };
  }
};