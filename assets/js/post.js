// Handles post creation via Netlify Function
(function(){
  const form = document.getElementById('postForm');
  if(!form) return;
  const statusEl = document.getElementById('postStatus');
  const toggleBtn = document.getElementById('toggleFormBtn');

  if(toggleBtn){
    toggleBtn.addEventListener('click', () => {
      const hidden = form.classList.toggle('hidden');
      toggleBtn.textContent = hidden ? 'Add Transmission' : 'Hide Form';
      if(!hidden){
        form.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Encoding transmission...';
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v,k)=> data[k]=v);
    data.date = new Date().toISOString();

    // Handle image file
    const file = fd.get('image');
    if(file && file.size){
      if(file.size > 500*1024){
        statusEl.textContent = 'Image too large (>500KB). Resize and retry.';
        return;
      }
      data.image = await fileToDataURL(file);
    }

    try {
      statusEl.textContent = 'Transmitting...';
      const res = await fetch('/.netlify/functions/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if(!res.ok){
        throw new Error(json.error || 'Failed');
      }
      statusEl.textContent = 'Posted successfully. Reloading feed...';
      form.reset();
      // Refresh posts
      setTimeout(()=> window.location.hash = '#posts', 200);
      setTimeout(()=> window.location.reload(), 600);
    } catch (err){
      console.error(err);
      statusEl.textContent = 'Error: ' + err.message;
    }
  });

  function fileToDataURL(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
})();