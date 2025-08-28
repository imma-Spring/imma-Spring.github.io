document.addEventListener("DOMContentLoaded", () => {
  // --- CUSTOM DROPDOWN TOGGLE ---
  const dropdown = document.querySelector(".dropdown");
  const btn = dropdown?.querySelector(".dropdown-btn");
  const menu = dropdown?.querySelector(".dropdown-menu");

  if (btn && menu) {
    // Remove click-to-open if you want hover instead
    // btn.addEventListener("click", () => {
    //   dropdown.classList.toggle("open");
    // });

    // Scroll to post on click
    menu.querySelectorAll("li").forEach(item => {
      item.addEventListener("click", () => {
        const target = document.getElementById(item.dataset.target);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
        dropdown.classList.remove("open");
      });
    });

    // Close if clicked outside
    document.addEventListener("click", e => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
      }
    });
  }

  // --- THEME TOGGLE ---
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light");
      toggle.textContent = "🌙";
    } else {
      toggle.textContent = "☀️";
    }

    toggle.addEventListener("click", () => {
      document.body.classList.toggle("light");
      const isLight = document.body.classList.contains("light");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      toggle.textContent = isLight ? "🌙" : "☀️";
    });
  }

  // --- LOAD BLOG POSTS FROM JSON ---
  const postsContainer = document.getElementById("posts");
  const dropdownList = document.getElementById("dropdown-list");

  fetch("blogposts.json")
    .then(res => res.json())
    .then(posts => {
      // Clear existing
      dropdownList.innerHTML = "";
      postsContainer.innerHTML = "";

      if (!posts || posts.length === 0) {
        postsContainer.innerHTML = "<p>No posts yet.</p>";
        return;
      }

      posts.forEach(post => {
        if (!post || !post.title || !post.content) return;

        // Generate safe ID from title
        const safeId = post.title.replace(/\s+/g, "-").toLowerCase();

        // Dropdown item
        const li = document.createElement("li");
        li.dataset.target = safeId;
        li.textContent = post.title;
        dropdownList.appendChild(li);

        li.addEventListener("click", () => {
          const target = document.getElementById(safeId);
          if (target) target.scrollIntoView({ behavior: "smooth" });
          dropdown.classList.remove("open");
        });

        // Post content
        const article = document.createElement("article");
        article.id = safeId;
        article.innerHTML = `<h2>${post.title}</h2><p>${post.content}</p>`;
        postsContainer.appendChild(article);
      });
    })
    .catch(err => {
      console.error("Error loading posts:", err);
      postsContainer.innerHTML = "<p>Failed to load posts.</p>";
    });
});

