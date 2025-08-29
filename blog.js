document.addEventListener("DOMContentLoaded", () => {
  const dropdownList = document.getElementById("dropdown-list");
  const postsContainer = document.getElementById("posts");

  if (!dropdownList || !postsContainer) {
    console.error("Missing required HTML elements: #dropdown-list or #posts");
    return;
  }

  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // Load posts from JSON
  fetch("blogposts.json")
    .then(res => res.json())
    .then(posts => {
      dropdownList.innerHTML = "";
      postsContainer.innerHTML = "";

      if (!posts || posts.length === 0) {
        postsContainer.innerHTML = "<p>No posts yet.</p>";
        return;
      }

      posts.reverse().forEach(post => {
        if (!post.title || !post.content) return;
        const id = post.title.replace(/\s+/g, "-").toLowerCase();

        // Add to dropdown menu
        const li = document.createElement("li");
        li.dataset.target = id;
        li.textContent = post.title;
        dropdownList.appendChild(li);

        // Add post content
        const article = document.createElement("article");
        article.id = id;
        article.innerHTML = `
          <h2>${escapeHTML(post.title)}</h2>
          <p>${escapeHTML(post.content).replace(/\n/g, "<br>")}</p>
        `;
        postsContainer.appendChild(article);
      });

      // Scroll to post on dropdown click
      dropdownList.querySelectorAll("li").forEach(item => {
        item.addEventListener("click", () => {
          const target = document.getElementById(item.dataset.target);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        });
      });
    })
    .catch(err => {
      console.error("Error loading posts:", err);
      postsContainer.innerHTML = "<p>Failed to load posts.</p>";
    });
});

