(() => {
  "use strict";
  const games = [
    {
      id: "snake",
      name: "Snake",
      file: "games/neonsnake1.html",
      art: "snake",
      category: "arcade",
      tag: "KLASYK",
      desc: "Jeszcze jeden kęs. Jeszcze jeden zakręt.",
      about:
        "Zbieraj jedzenie i wydłużaj węża, omijając ściany oraz własny ogon. Przed startem wybierz wielkość planszy i tempo. Planuj zakręty wcześniej — miejsca ubywa z każdym punktem.",
      controls: "Strzałki lub przyciski kierunkowe na ekranie.",
    },
    {
      id: "saper",
      name: "Saper",
      file: "games/saper.html",
      art: "saper",
      category: "logic",
      tag: "LOGIKA",
      desc: "Trochę liczenia. Odrobina odwagi.",
      about:
        "Odkrywaj pola bez trafienia na minę. Liczba pokazuje, ile min sąsiaduje z odkrytym polem. Oznaczaj podejrzane miejsca flagą; pierwszy ruch na tej planszy jest bezpieczny. Wybierz poziom i odkryj wszystkie wolne pola.",
      controls:
        "Kliknięcie: odkryj. Prawy przycisk: flaga. Na telefonie przełącz tryb Odkryj / Flaga.",
    },
    {
      id: "tictactoe",
      name: "Kółko i krzyżyk",
      file: "games/tictactoe.html",
      art: "tictactoe",
      category: "logic",
      tag: "DLA DWÓCH / SOLO",
      desc: "Trzy w linii. Znasz zasady.",
      about:
        "Ustaw trzy swoje znaki w jednym rzędzie, kolumnie lub po przekątnej. Zagraj z drugą osobą na jednym urządzeniu albo wybierz komputer i poziom trudności. Gdy rywal ma dwa znaki w linii, zablokuj trzecie pole.",
      controls:
        "Kliknij lub dotknij wolnego pola. Tryb i poziom wybierzesz nad planszą.",
    },
    {
      id: "maze",
      name: "Labirynt",
      file: "games/neonmaze.html",
      art: "maze",
      category: "logic",
      tag: "NA ORIENTACJĘ",
      desc: "Każdy ślepy zaułek czegoś uczy.",
      about:
        "Znajdź trasę przez labirynt i dotrzyj do wyjścia. Przyjrzyj się rozgałęzieniom, zanim skręcisz. Jeśli utkniesz, wróć do ostatniego rozwidlenia i spróbuj innej drogi.",
      controls: "Strzałki / W, A, S, D lub przyciski kierunkowe na ekranie.",
    },
    {
      id: "geometry",
      name: "Geometry Run",
      file: "games/geometry-game.html",
      art: "geometry",
      category: "arcade",
      tag: "RYTM I REFLEKS",
      desc: "Jeden skok za późno to też za późno.",
      about:
        "Przeskakuj przeszkody i wyczuj rytm trasy. W trybie samolotu przytrzymuj przycisk, żeby się wznosić, i puszczaj, żeby opadać. Zacznij od spokojniejszego poziomu; kolejne podejścia pozwolą poznać układ przeszkód.",
      controls:
        "Spacja, lewy przycisk myszy lub dotknięcie: skok / wznoszenie.",
    },
    {
      id: "arena",
      name: "Snake Arena",
      file: "games/snake.html",
      art: "arena",
      category: "arcade",
      tag: "ARENA Z BOTAMI",
      desc: "Więcej węży. Mniej miejsca na błędy.",
      about:
        "Poruszaj się po arenie, zbieraj jedzenie i unikaj zderzeń. Rywale w tej wersji są sterowani przez komputer — to lokalna gra z botami. Przyspieszenie pomaga uciec, ale wymaga większej kontroli.",
      controls:
        "Mysz: kierunek. Przytrzymanie przycisku: przyspieszenie. Na telefonie użyj joysticka.",
    },
    {
      id: "saper-classic",
      name: "Saper / edycja klasyczna",
      file: "saper.html",
      art: "saper-classic",
      category: "logic",
      tag: "Z ARCHIWUM",
      desc: "Surowa plansza, konkretne wyzwanie.",
      about:
        "Wcześniejsza wersja sapera z wyborem poziomu i podpowiedziami. Odszukaj pola bez min, korzystając z liczb. Ta edycja ma osobny lokalny zapis, więc możesz porównać ją z nowszą wersją.",
      controls: "Kliknięcie: odkryj. Przełącz tryb flagi, aby oznaczać miny.",
    },
    {
      id: "little-flight",
      name: "Mały lot",
      file: "flappy.html",
      art: "bird-classic",
      category: "arcade",
      tag: "ZRĘCZNOŚCIOWA",
      desc: "Jeden podskok. Jeszcze kawałek nieba.",
      about:
        "Poprowadź małego ptaka pomiędzy przeszkodami. Każda ominięta para to punkt. Ta samodzielna wersja korzysta z figur geometrycznych i własnej oprawy, bez pobranych grafik lub dźwięków innych gier.",
      controls: "Spacja, kliknięcie albo dotknięcie planszy.",
    },
  ];
  window.SpinnerGames = games;
  const grid = document.querySelector("#game-grid");
  if (!grid) return;
  const prefs = window.SpinnerStorage.preferences;
  const history = prefs.get("recent", []);
  if (Array.isArray(history)) {
    const recentGames = history
      .map((id) => games.find((game) => game.id === id))
      .filter(Boolean)
      .slice(0, 3);
    if (recentGames.length) {
      const strip = document.createElement("div");
      strip.className = "recent-strip";
      const label = document.createElement("span");
      label.textContent = "WRÓCIMY DO RUNDY?";
      strip.append(label);
      for (const game of recentGames) {
        const link = document.createElement("a");
        link.href = "gra.html?gra=" + game.id;
        link.textContent = game.name + " ↗";
        strip.append(link);
      }
      document.querySelector(".catalog-toolbar").after(strip);
      window.addEventListener("spinner:preferences-cleared", () =>
        strip.remove(),
      );
    }
  }
  let favorites = new Set(
    (Array.isArray(prefs.get("favorites", []))
      ? prefs.get("favorites", [])
      : []
    ).filter((id) => games.some((game) => game.id === id)),
  );
  let filter = "all";
  const search = document.querySelector("#game-search");
  const fold = (text) =>
    text
      .toLocaleLowerCase("pl")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l");
  function render() {
    const query = fold(search.value.trim());
    const list = games.filter(
      (game) =>
        (filter === "all" ||
          (filter === "favorites"
            ? favorites.has(game.id)
            : game.category === filter)) &&
        fold(game.name + " " + game.desc).includes(query),
    );
    grid.replaceChildren();
    for (const game of list) {
      const article = document.createElement("article");
      article.className = "game-card";
      const url = "gra.html?gra=" + encodeURIComponent(game.id);
      const selected = favorites.has(game.id);
      article.innerHTML = `<a class="card-image" href="${url}" tabindex="-1" aria-hidden="true"><img src="assets/art/${game.art}.svg" alt="" width="600" height="430" loading="lazy"><span class="card-number">SG / ${String(games.indexOf(game) + 1).padStart(2, "0")}</span><span class="card-open">↗</span></a><div class="card-info"><h3><a href="${url}">${game.name}</a></h3><button class="favorite" aria-label="${selected ? "Usuń z ulubionych" : "Dodaj do ulubionych"}: ${game.name}" aria-pressed="${selected}">${selected ? "♥" : "♡"}</button></div><p class="card-desc">${game.desc}</p><div class="card-meta">${game.tag}</div>`;
      article.querySelector(".favorite").addEventListener("click", () => {
        if (favorites.has(game.id)) favorites.delete(game.id);
        else favorites.add(game.id);
        prefs.set("favorites", [...favorites]);
        render();
        const button = [...grid.querySelectorAll(".favorite")].find((btn) =>
          btn.getAttribute("aria-label").endsWith(": " + game.name),
        );
        button?.focus({ preventScroll: true });
        if (!window.SpinnerStorage.consent?.preferences)
          window.spinnerToast(
            "Ulubione są dostępne na tej stronie. Włącz zapis w ustawieniach cookies, aby zachować je na później.",
          );
      });
      grid.append(article);
    }
    document.querySelector("#empty-state").hidden = list.length > 0;
    document.querySelector("#result-count").textContent =
      `${String(list.length).padStart(2, "0")} / ${games.length} GIER`;
    document.querySelector("#total-count").textContent = games.length;
  }
  search.addEventListener("input", render);
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    }),
  );
  window.addEventListener("spinner:preferences-cleared", () => {
    favorites.clear();
    render();
  });
  render();
})();
