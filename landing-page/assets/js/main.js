function copyText(text, onDone) {
  navigator.clipboard.writeText(text).then(onDone).catch(() => {});
}

document.querySelectorAll("[data-copy]").forEach((el) => {
  el.addEventListener("click", () => {
    const text = el.getAttribute("data-copy");
    const icon = el.querySelector(".material-symbols-outlined");
    copyText(text, () => {
      if (icon) {
        const prev = icon.textContent;
        icon.textContent = "check";
        icon.classList.add("text-emerald-400");
        setTimeout(() => {
          icon.textContent = prev;
          icon.classList.remove("text-emerald-400");
        }, 1800);
      }
    });
  });
});

function switchTab(btn, tabId) {
  document.querySelectorAll(".install-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".install-block").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");
}

function copyBlock(tabId) {
  const block = document.getElementById(tabId);
  if (!block) return;
  const lines = Array.from(block.querySelectorAll("[data-line]"))
    .map((d) => d.getAttribute("data-line"))
    .filter(Boolean);
  const text = lines.join("\n");
  const btn = block.querySelector(".copy-block-btn");
  copyText(text, () => {
    if (btn) {
      const prev = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copied';
      setTimeout(() => {
        btn.innerHTML = prev;
      }, 1800);
    }
  });
}

const orb = document.querySelector(".pulse-orb");
if (orb) {
  setInterval(() => {
    orb.style.animationDuration = `${1.5 + Math.random() * 2}s`;
  }, 3000);
}
