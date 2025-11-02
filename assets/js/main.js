// Main JS for Semaj blog
(async function(){
  const container = document.getElementById('posts');
  if(!container){ return; }
  try {
    const res = await fetch('posts/posts.json', {cache: 'no-store'});
    if(!res.ok) throw new Error('Failed to load posts');
    const posts = await res.json();
    if(!Array.isArray(posts) || posts.length === 0){
      container.innerHTML = `<div class="empty">No transmissions yet. The grid is quiet... for now.</div>`;
      return;
    }
    const html = posts.map(p => {
      const date = p.date ? new Date(p.date).toLocaleDateString() : 'Unknown Date';
      const img = p.image ? `<div class="image-wrap"><img class="post-image" src="${p.image}" alt="${(p.title||'post image').replace(/"/g,'')}"></div>` : '';
      return `<article class="post">
        <h2>${p.title || 'Untitled Signal'}</h2>
        <div class="meta">${date} — ${p.author || 'Anon'} — <span class="tag">${p.tag || 'general'}</span></div>
        ${img}
        <p>${p.summary || ''}</p>
        ${p.body ? `<div class="body">${p.body}</div>` : ''}
      </article>`;
    }).join('\n');
    container.innerHTML = html;
  } catch (e){
    console.error(e);
    container.innerHTML = `<div class="error">Signal jammed. Could not retrieve posts.</div>`;
  }
})();