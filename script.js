let stories = JSON.parse(localStorage.getItem("stories")) || [];

function saveStories() {
    localStorage.setItem("stories", JSON.stringify(stories));
}

function renderStories(stories) {
    const storyList = document.getElementById("story-list");
    if (!storyList) return;

    if (!stories || stories.length === 0) {
        storyList.innerHTML = `<p>No stories yet. Be the first to share. ✨</p>`;
        return;
    }

    storyList.innerHTML = stories.map(s => `
        <div class="story-card" data-id="${s.id}">
            <div style="font-weight:bold; color:#e75480; margin-bottom:8px;">
                ${s.category === "hope" ? "Hope Card" : "Whisper Card"}
            </div>
            <div>
                ${s.text.length > 100 
                    ? `<span>${s.text.slice(0, 100)}...</span> <button class="view-more-btn">View More</button>`
                    : `<span>${s.text}</span>`
                }
            </div>
            <small style="color:#888;">${new Date(s.date).toLocaleString()}</small>
            <div class="actions">
                <button class="like-btn">❤️ Like (${s.likes || 0})</button>
                <button class="care-btn">💗 Care (${s.cares || 0})</button>
            </div>
        </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
    const hform = document.getElementById("hform");
    const wform = document.getElementById("wform");

    if (hform || wform) {
        const form = hform || wform;
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const storyText = form.querySelector("textarea").value.trim();

            if (storyText.length < 10) {
                alert("Please write at least 10 characters.");
                return;
            }

            await addWhisper(storyText);
            alert("Your story has been submitted anonymously. ❤️");
            form.reset();

            // Optionally, re-fetch and render stories if you show them on this page
            // const whispers = await fetchWhispers();
            // renderStories(whispers);
        });
    }

    // Render stories if on read.html
    if (document.getElementById("story-list")) {
        const whispers = await fetchWhispers();
        renderStories(whispers);

        document.getElementById("story-list").addEventListener("click", async function(e) {
            const card = e.target.closest(".story-card");
            if (!card) return;
            const id = card.dataset.id;

            if (e.target.classList.contains("like-btn")) {
                await likeWhisper(id);
            }
            if (e.target.classList.contains("care-btn")) {
                await careWhisper(id);
            }
            // Fetch updated whispers and re-render
            const updatedWhispers = await fetchWhispers();
            renderStories(updatedWhispers);

            if (e.target.classList.contains("read-more")) {
                const whisper = updatedWhispers.find(w => w.id == id);
                e.target.parentElement.innerHTML = whisper.text;
            }
        });

        document.getElementById("search-bar").addEventListener("input", async function(e) {
            const val = e.target.value.trim();
            const allWhispers = await fetchWhispers();
            if (val) {
                renderStories(allWhispers.filter(s => String(s.id).includes(val)));
            } else {
                renderStories(allWhispers);
            }
        });
    }

    if (document.getElementById("clear-btn") && location.hostname === "localhost") {
        document.getElementById("clear-btn").addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all stories? This action cannot be undone.")) {
                stories = [];
                saveStories();
                renderStories();
            }
        });
    }

    if (document.getElementById("share-btn")) {
        document.getElementById("share-btn").addEventListener("click", () => {
            if (navigator.share) {
                navigator.share({
                    title: "Whispers",
                    text: "An anonymous safe space for sharing stories ❤️",
                    url: window.location.href
                }).catch(console.error);
            } else {
                alert("Sharing is not supported on this device.");
            }
        });
    }

    // Navigation logic for main buttons
    const readBtn = document.querySelector('button[data-action="read"]');
    const shareBtn = document.querySelector('button[data-action="share"]');
    const storySection = document.getElementById("story-section");
    const formSection = document.getElementById("form-section");

    if (readBtn && storySection && formSection) {
        readBtn.addEventListener("click", () => {
            storySection.style.display = "block";
            formSection.style.display = "none";
        });
    }

    if (shareBtn && storySection && formSection) {
        shareBtn.addEventListener("click", () => {
            storySection.style.display = "none";
            formSection.style.display = "block";
        });
    }

    if (storySection && formSection) {
        storySection.style.display = "block";
        formSection.style.display = "none";
    }

    document.querySelector('button[data-action="read"]').addEventListener('click', function() {
      window.location.href = 'read.html';
    });
});

// Replace 'http://localhost:5000' with your deployed URL when live

// Get all whispers
async function fetchWhispers() {
  const res = await fetch('http://localhost:5000/api/whispers');
  return await res.json();
}

// Add a new whisper
async function addWhisper(text) {
  const res = await fetch('http://localhost:5000/api/whispers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await res.json();
}

// Like a whisper
async function likeWhisper(id) {
  const res = await fetch(`http://localhost:5000/api/whispers/${id}/like`, { method: 'POST' });
  return await res.json();
}

// Care react
async function careWhisper(id) {
  const res = await fetch(`http://localhost:5000/api/whispers/${id}/care`, { method: 'POST' });
  return await res.json();
}
