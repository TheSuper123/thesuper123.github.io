(() => {
  "use strict";
  const S = SpinnerHundred,
    D = SpinnerCompassData,
    H = S.create(["ODPOWIEDZI", "POKRYCIE", "MODEL"]),
    names = [
      "Zdecydowanie nie",
      "Raczej nie",
      "Neutralnie",
      "Raczej tak",
      "Zdecydowanie tak",
    ],
    values = [-2, -1, 0, 1, 2];
  let state,
    tab = "compass";
  H.pauseKey = null;
  document.querySelector("#more-new").textContent = "Od nowa";
  function calculate(answers) {
    const sums = Array(5).fill(0),
      counts = Array(5).fill(0);
    for (let i = 0; i < D.questions.length; i++) {
      const a = answers[i],
        q = D.questions[i];
      if (
        a?.seen &&
        Number.isInteger(a.value) &&
        a.value >= -2 &&
        a.value <= 2
      ) {
        sums[q.axis] += a.value * q.direction;
        counts[q.axis]++;
      }
    }
    const axes = sums.map((sum, i) =>
        counts[i] ? (sum / (counts[i] * 2)) * 10 : null,
      ),
      eligible = counts.every((n) => n >= 3);
    const rank = (models) =>
      eligible
        ? models
            .map((model) => ({
              ...model,
              distance: Math.sqrt(
                model.values.reduce(
                  (sum, v, i) => sum + (v - axes[i]) ** 2,
                  0,
                ) / 5,
              ),
            }))
            .map((m) => ({
              ...m,
              similarity: Math.max(0, 100 * (1 - m.distance / 20)),
            }))
            .sort(
              (a, b) =>
                a.distance - b.distance || a.name.localeCompare(b.name, "pl"),
            )
        : [];
    return {
      axes,
      counts,
      eligible,
      answered: counts.reduce((a, b) => a + b, 0),
      parties: rank(D.parties),
      ideologies: rank(D.ideologies),
    };
  }
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function answer(value) {
    if (
      !H.active() ||
      state.screen !== "questions" ||
      (value !== null && !values.includes(value))
    )
      return false;
    H.start();
    state.answers[state.index] = { seen: true, value };
    if (state.index < 29) state.index++;
    else results();
    H.render();
    return true;
  }
  function results() {
    state.result = calculate(state.answers);
    state.screen = state.result.eligible ? "results" : "coverage";
    H.timer.stop();
    tab = "compass";
    H.say(
      state.result.eligible
        ? "Wynik pozostaje tylko w tej karcie. Możesz zmienić odpowiedzi albo wyczyścić całość."
        : "Potrzeba co najmniej trzech odpowiedzi na każdą z pięciu osi. Pominięcia nie są odpowiedzią neutralną.",
    );
  }
  function edit(index = 0) {
    if (!H.active()) return;
    state.screen = "questions";
    state.index = S.clamp(index, 0, 29);
    H.render();
  }
  function scaleRow(axis, value) {
    const row = el("div", undefined, "co-scale-row"),
      head = el("div", undefined, "co-scale-heading");
    head.append(
      el("strong", axis.name),
      el("span", value.toFixed(1).replace(".", ",")),
    );
    row.append(head);
    const meter = el("div", undefined, "co-meter"),
      dot = el("i");
    dot.style.left = (value + 10) * 5 + "%";
    meter.append(dot);
    row.append(meter);
    const ends = el("div", undefined, "co-scale-ends");
    ends.append(el("span", axis.low), el("span", axis.high));
    row.append(ends);
    return row;
  }
  function plot(result) {
    const wrap = el("div", undefined, "co-plot-wrap"),
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 360 340");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `Kompas: gospodarka ${result.axes[0].toFixed(1)}, władza i swobody ${result.axes[1].toFixed(1)}. Pozostałe trzy osie są pokazane osobno.`,
    );
    const x = 180 + result.axes[0] * 13,
      y = 165 - result.axes[1] * 12;
    svg.innerHTML = `<rect x="50" y="45" width="130" height="120" class="co-quadrant"/><rect x="180" y="165" width="130" height="120" class="co-quadrant"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${50 + i * 26} 45V285M50 ${45 + i * 24}H310" class="co-grid-line"/>`).join("")}<path d="M50 165H310M180 45V285" class="co-axis-line"/><text x="180" y="23" text-anchor="middle">Silne uprawnienia władzy</text><text x="180" y="322" text-anchor="middle">Swobody obywatelskie</text><text transform="translate(18 165) rotate(-90)" text-anchor="middle">Redystrybucja</text><text transform="translate(342 165) rotate(90)" text-anchor="middle">Wolny rynek</text><circle cx="${x}" cy="${y}" r="9" class="co-you"/><circle cx="${x}" cy="${y}" r="16" class="co-you-ring"/>`;
    wrap.append(
      svg,
      el("p", "Twój punkt • gospodarka × władza i swobody", "co-caption"),
    );
    return wrap;
  }
  function methodology(parent) {
    parent.append(
      el("h3", "Jak liczymy wynik"),
      el(
        "p",
        "30 stwierdzeń, po sześć na każdą oś. Skala odpowiedzi: −2, −1, 0, +1, +2. Każda oś ma pytania w obu kierunkach. Neutralnie liczy się jako zero; „Pomiń” nie wchodzi do średniej.",
      ),
      el(
        "p",
        "Wynik osi = 10 × suma(odpowiedź × kierunek) / (2 × liczba odpowiedzi). Wymagamy minimum trzech odpowiedzi w każdej osi. Wyniki mieszczą się od −10 do +10. Kompas pokazuje tylko pierwsze dwie osie; dopasowania używają wszystkich pięciu z jednakową wagą.",
      ),
      el(
        "p",
        "Odległość modelu = pierwiastek ze średniej pięciu kwadratów różnic. Podobieństwo = 100 × (1 − odległość / 20). To wskaźnik podobieństwa skal, nie prawdopodobieństwo ani procent poparcia. Bliskie wyniki traktuj jako podobne, a nie rozstrzygający ranking.",
      ),
      el("p", D.reference),
      el(
        "p",
        "To narzędzie edukacyjne, bez walidacji psychometrycznej. Nie diagnozuje tożsamości politycznej i nie zaleca, na kogo głosować. Nie obejmuje wszystkich partii ani wszystkich tematów. Linki do oficjalnych stron służą samodzielnemu sprawdzeniu obecnych stanowisk.",
      ),
    );
    const table = el("table", undefined, "co-table"),
      caption = el(
        "caption",
        "Jawne współrzędne modeli: gospodarka / władza / obyczaje / UE / klimat",
      );
    table.append(caption);
    for (const party of D.parties) {
      const tr = el("tr");
      tr.append(el("th", party.name), el("td", party.values.join(" / ")));
      table.append(tr);
    }
    parent.append(table);
  }
  function exportResult() {
    if (!H.active() || !state.result?.eligible) return false;
    const body = {
      version: D.version,
      reference: D.reference,
      axes: D.axes.map((a, i) => ({
        axis: a.name,
        score: state.result.axes[i],
        answered: state.result.counts[i],
      })),
      answers: D.questions.map((q, i) => ({
        statement: q.text,
        answer: state.answers[i].value,
        seen: state.answers[i].seen,
        direction: q.direction,
        axis: D.axes[q.axis].name,
      })),
      parties: state.result.parties.map((p) => ({
        name: p.name,
        similarity: p.similarity,
        profile: p.values,
      })),
    };
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(body, null, 2)], { type: "application/json" }),
      );
    a.href = url;
    a.download = "moj-kompas-polityczny.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
  const back = H.button("Wstecz", () => {
    if (H.active() && state.screen === "questions" && state.index > 0) {
      state.index--;
      H.render();
    }
  });
  const showResult = H.button("Wynik", () => {
    if (H.active() && calculate(state.answers).eligible) {
      results();
      H.render();
    }
  });
  H.button("Metoda", () => {
    const dialog = document.createElement("dialog");
    dialog.className = "co-method-dialog";
    dialog.setAttribute("aria-label", "Metoda kompasu politycznego");
    const close = el("button", "Zamknij");
    close.onclick = () => dialog.close();
    dialog.addEventListener("close", () => dialog.remove());
    dialog.append(close);
    methodology(dialog);
    document.body.append(dialog);
    dialog.showModal();
  });
  H.onRender = () => {
    const result = calculate(state.answers);
    H.stats([
      result.answered + " / 30",
      result.counts.filter((n) => n >= 3).length + " / 5 osi",
      "1.0",
    ]);
    back.disabled = state.screen !== "questions" || state.index === 0;
    showResult.disabled = !result.eligible || state.screen === "results";
    H.board.className = "co-board";
    H.board.replaceChildren();
    const root = el("section", undefined, "co-card");
    root.dataset.aspect = innerWidth < 550 ? "0.8" : "1.65";
    H.board.append(root);
    if (state.screen === "questions") {
      const q = D.questions[state.index],
        current = state.answers[state.index];
      root.append(
        el(
          "div",
          `PYTANIE ${state.index + 1} / 30 • ${D.axes[q.axis].name.toUpperCase()}`,
          "co-kicker",
        ),
      );
      const progress = el("progress");
      progress.max = 30;
      progress.value = state.answers.filter((a) => a.seen).length;
      progress.setAttribute("aria-label", "Postęp kompasu");
      root.append(progress);
      const title = el("h3", q.text);
      title.tabIndex = -1;
      root.append(title);
      const choices = el("div", undefined, "co-choices");
      values.forEach((value, k) => {
        const b = H.button(names[k], () => answer(value), choices);
        b.setAttribute(
          "aria-pressed",
          String(current.seen && current.value === value),
        );
        b.dataset.value = value;
      });
      const skip = H.button("Pomiń / nie wiem", () => answer(null), choices);
      skip.setAttribute(
        "aria-pressed",
        String(current.seen && current.value === null),
      );
      root.append(
        choices,
        el(
          "p",
          "Odpowiedzi zostają w pamięci tej karty. Nie zapisujemy ich do konta ani przeglądarki.",
          "co-caption",
        ),
      );
    } else if (state.screen === "coverage") {
      root.append(
        el("h3", "Jeszcze za mało odpowiedzi"),
        el(
          "p",
          "Każda oś potrzebuje przynajmniej trzech odpowiedzi. „Neutralnie” oznacza środek, „Pomiń” nie jest liczone.",
        ),
      );
      for (let axis = 0; axis < 5; axis++)
        if (result.counts[axis] < 3)
          H.button(
            `${D.axes[axis].name}: ${result.counts[axis]} / 3 — uzupełnij`,
            () =>
              edit(
                D.questions.findIndex(
                  (q, i) =>
                    q.axis === axis &&
                    (!state.answers[i].seen || state.answers[i].value === null),
                ),
              ),
            root,
          );
    } else {
      const tabs = el("nav", undefined, "co-tabs");
      tabs.setAttribute("aria-label", "Widoki wyniku");
      for (const [id, label] of [
        ["compass", "Kompas"],
        ["ideology", "Ideologie"],
        ["parties", "Partie"],
        ["answers", "Odpowiedzi"],
      ]) {
        const b = H.button(
          label,
          () => {
            tab = id;
            H.render();
          },
          tabs,
        );
        b.setAttribute("aria-pressed", String(tab === id));
      }
      root.append(tabs);
      const content = el("div", undefined, "co-result-content");
      root.append(content);
      if (tab === "compass") {
        content.classList.add("co-overview");
        content.append(plot(result));
        const scales = el("div", undefined, "co-scales");
        D.axes.forEach((axis, i) =>
          scales.append(scaleRow(axis, result.axes[i])),
        );
        content.append(scales);
      }
      if (tab === "ideology") {
        const centered = result.axes.every((v) => Math.abs(v) < 2);
        content.append(
          el(
            "h3",
            centered
              ? "Profil centrowy lub mieszany"
              : "Najbliższe nurty w modelu",
          ),
          el(
            "p",
            centered
              ? "Odpowiedzi nie wskazują silnego odchylenia. Neutralność może oznaczać umiar albo różne stanowiska w tej samej osi."
              : "Kilka nazw może pasować jednocześnie. Etykiety są skrótem, a nie definicją Twojej tożsamości.",
          ),
        );
        for (const model of result.ideologies.slice(0, 3)) {
          const card = el("article", undefined, "co-profile");
          card.append(
            el("h4", model.name),
            el("p", model.note),
            el(
              "small",
              `Podobieństwo modelowe: ${Math.round(model.similarity)} / 100`,
            ),
          );
          content.append(card);
        }
      }
      if (tab === "parties") {
        content.append(
          el("h3", "Partie • modele orientacyjne"),
          el("p", D.reference, "co-caption"),
          el(
            "p",
            "Porównanie pięciu skal, bez rekomendacji wyborczej. Różnice jednego czy dwóch punktów nie rozstrzygają dopasowania.",
          ),
        );
        for (const party of result.parties) {
          const card = el("article", undefined, "co-profile"),
            heading = el("h4", party.name),
            badge = el(
              "span",
              Math.round(party.similarity) + " / 100",
              "co-badge",
            );
          heading.append(badge);
          card.append(heading, el("p", party.note));
          const diff = el(
            "p",
            D.axes
              .map(
                (a, i) =>
                  `${a.name}: Ty ${result.axes[i].toFixed(1)} / model ${party.values[i]}`,
              )
              .join(" · "),
            "co-caption",
          );
          card.append(diff);
          const source = el(
            "a",
            "Oficjalna strona — sprawdź obecny program ↗",
          );
          source.href = party.source;
          source.target = "_blank";
          source.rel = "noopener noreferrer";
          card.append(source);
          content.append(card);
        }
      }
      if (tab === "answers") {
        content.append(el("h3", "Twoje odpowiedzi"));
        D.questions.forEach((q, i) => {
          const row = el("article", undefined, "co-answer-row"),
            a = state.answers[i];
          row.append(
            el("p", `${i + 1}. ${q.text}`),
            el(
              "small",
              !a.seen
                ? "Bez odpowiedzi"
                : a.value === null
                  ? "Pominięto"
                  : names[values.indexOf(a.value)],
            ),
          );
          H.button("Zmień", () => edit(i), row);
          content.append(row);
        });
      }
      const footer = el("div", undefined, "co-result-actions");
      H.button("Zmień odpowiedzi", () => edit(0), footer);
      H.button("Pobierz wynik", exportResult, footer);
      H.button("Wyczyść wynik", () => H.onNew(), footer);
      root.append(footer);
    }
  };
  H.onNew = () => {
    state = {
      answers: Array.from({ length: 30 }, () => ({ seen: false, value: null })),
      index: 0,
      screen: "questions",
      result: null,
    };
    tab = "compass";
    H.reset();
    H.say(
      "30 stwierdzeń, pięć osi. Pomiń, jeśli nie masz zdania. Możesz wracać do odpowiedzi.",
    );
  };
  H.onTick = () => {};
  H.keys((key, event) => {
    if (event.repeat || state.screen !== "questions") return false;
    if (/^[1-5]$/.test(key)) {
      answer(values[Number(key) - 1]);
      return true;
    }
    if (key === "0") {
      answer(null);
      return true;
    }
  });
  S.api(
    H,
    {
      answer,
      calculate,
      edit,
      results: () => {
        if (H.active()) {
          results();
          H.render();
        }
      },
      exportResult,
      data: D,
      getState: () => state,
    },
    () => state,
  );
  window.addEventListener("resize", () => H.render());
  H.onNew();
})();
