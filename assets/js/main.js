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
    function tagColor(tag){
      const base = (tag || 'general').toLowerCase();
      let h=0; for(let i=0;i<base.length;i++){ h = (h*31 + base.charCodeAt(i)) % 360; }
      return `hsl(${h},65%,50%)`;
    }
    const html = posts.map(p => {
      const date = p.date ? new Date(p.date).toLocaleDateString() : 'Unknown Date';
      const img = p.image ? `<div class="image-wrap"><img class="post-image" src="${p.image}" alt="${(p.title||'post image').replace(/"/g,'')}"></div>` : '';
      const flynn = (p.author || '').toLowerCase() === 'flynn' ? ' flynn' : '';
      const styleTagColor = !flynn ? ` style=\"--tag-color:${tagColor(p.tag)}\"` : '';
      const delBtn = `<button class=\"delete-btn\" data-id=\"${p.id || ''}\" data-title=\"${(p.title||'').replace(/"/g,'')}\" data-date=\"${p.date || ''}\">Delete</button>`;
      return `<article class="post${flynn}"${styleTagColor}>
        <h2>${p.title || 'Untitled Signal'}</h2>
        <div class="meta">${date} — ${p.author || 'Anon'} — <span class="tag">${p.tag || 'general'}</span></div>
        ${img}
        <p>${p.summary || ''}</p>
        ${p.body ? `<div class="body">${p.body}</div>` : ''}
        <div class="controls">${delBtn}</div>
      </article>`;
    }).join('\n');
    container.innerHTML = html;

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        const dateAttr = btn.getAttribute('data-date');
        if(!confirm('Delete this post?')) return;
        btn.disabled = true; btn.textContent = 'Deleting…';
        try {
          const payload = id ? { id } : { title, date: dateAttr };
          const resDel = await fetch('/.netlify/functions/delete-post', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });
          const j = await resDel.json();
          if(!resDel.ok) throw new Error(j.error || 'Delete failed');
          btn.textContent = 'Deleted';
          setTimeout(()=> btn.closest('article').remove(), 200);
        } catch(err){
          console.error(err);
          btn.textContent = 'Error';
          btn.disabled = false;
        }
      });
    });
  } catch (e){
    console.error(e);
    container.innerHTML = `<div class="error">Signal jammed. Could not retrieve posts.</div>`;
  }
})();