const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav-links");

if (menuButton && navigation) {
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navigation.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });
}

const newsContainer = document.querySelector("[data-news-source]");

if (newsContainer) {
  fetch(newsContainer.dataset.newsSource)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load news (${response.status})`);
      return response.text();
    })
    .then((html) => {
      const newsDocument = new DOMParser().parseFromString(html, "text/html");
      const newsList = newsDocument.querySelector(".all-news .news-list");

      if (!newsList) throw new Error("No news list found");
      newsContainer.replaceChildren(newsList.cloneNode(true));
    })
    .catch(() => {
      const message = document.createElement("p");
      const link = document.createElement("a");
      link.href = newsContainer.dataset.newsSource;
      link.textContent = "View all news";
      message.append("News could not be loaded here. ", link, ".");
      newsContainer.replaceChildren(message);
    });
}
