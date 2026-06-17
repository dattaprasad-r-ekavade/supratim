// Install tabs
    function switchTab(btn, tabId) {
      document.querySelectorAll('.install-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.install-block').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    // Copy hero command
    function copyHeroCmd(el) {
      navigator.clipboard.writeText('npx supratim').then(() => {
        const btn = el.querySelector('.copy-btn i');
        btn.className = 'fas fa-check';
        setTimeout(() => { btn.className = 'far fa-copy'; }, 1800);
      });
    }

    // Copy code block (text content only)
    function copyBlock(tabId) {
      const block = document.getElementById(tabId);
      const lines = Array.from(block.querySelectorAll('div')).map(d => d.textContent.replace(/^\$\s+/, '').trim()).filter(Boolean);
      const text = lines.join('\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = block.querySelector('.copy-block-btn');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => { btn.innerHTML = '<i class="far fa-copy"></i> Copy'; }, 1800);
      });
    }