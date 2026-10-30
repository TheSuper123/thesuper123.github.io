(() => {
  "use strict";

  const becauseOfThat = ["deshalb", "darum", "deswegen"];
  const key = [
    {
      words: ["weil"],
      why: "Po „weil” odmieniony czasownik „bin” stoi na końcu.",
    },
    {
      words: ["und"],
      why: "„Und” dodaje informację. Oba zdania zachowują szyk prosty.",
    },
    {
      words: ["aber"],
      why: "„Aber” wyraża przeciwstawienie, bez zmiany szyku: „ich habe”.",
    },
    {
      words: ["dann"],
      why: "„Dann” wskazuje następny krok. Po nim stoi czasownik „gehe”, a potem podmiot „ich”.",
    },
    {
      words: ["ob"],
      why: "Pytanie zależne z „ob” oznacza „czy”. Czasownik „haben” trafia na koniec.",
    },
    {
      words: ["sondern"],
      why: "„Sondern” poprawia wcześniejsze przeczenie „kein Fleisch”. Dalej jest szyk prosty: „ich esse”.",
    },
    {
      words: becauseOfThat,
      why: "Wszystkie trzy wyrazy oznaczają tu „dlatego”. Po nich jest szyk przestawny: „bleiben wir”.",
    },
    {
      words: ["wann"],
      why: "„Wann” wprowadza pytanie zależne o czas. „Abfährt” stoi na końcu; „wenn” nie zastępuje tu „wann”.",
    },
    {
      words: ["sonst"],
      why: "„Sonst” zapowiada, co stanie się w przeciwnym razie. Po nim: „verpassen wir”.",
    },
    {
      words: ["dass"],
      why: "„Dass” wprowadza treść tego, co wiem. Czasownik „sprichst” stoi na końcu.",
    },
    {
      words: ["oder"],
      why: "„Oder” łączy dwie możliwości. W obu częściach tego zdania pozostaje szyk pytania.",
    },
    {
      words: ["trotzdem"],
      why: "„Trotzdem” oznacza działanie mimo przeszkody. Po nim jest szyk przestawny: „lerne ich”.",
    },
    {
      words: ["warum"],
      why: "„Warum” pyta o przyczynę. W pytaniu zależnym „bist” stoi na końcu.",
    },
    {
      words: ["denn"],
      why: "„Denn” podaje powód i zachowuje szyk prosty: „es regnet heute stark”. Po „weil” należałoby zmienić kolejność na „es heute stark regnet”.",
    },
    {
      words: ["außerdem"],
      why: "„Außerdem” dodaje kolejną informację. Po nim: „hat es”. Można też wpisać „ausserdem”.",
    },
    {
      words: becauseOfThat,
      why: "Brak autobusu jest przyczyną. „Darum”, „deshalb” i „deswegen” pasują przed „gehe ich”.",
    },
    {
      words: ["weil"],
      why: "„Weil” wprowadza przyczynę. Odmieniony czasownik „wird” zamyka zdanie podrzędne.",
    },
    {
      words: becauseOfThat,
      why: "Poprawa jest skutkiem treningu. Wszystkie trzy wyrazy pasują przed „werde ich”.",
    },
    {
      words: ["dass"],
      why: "„Dass” wprowadza treść wypowiedzi. „Kommt” stoi na końcu.",
    },
    {
      words: ["sondern"],
      why: "Po przeczeniu „keinen Kaffee” „sondern” wprowadza właściwą alternatywę. Dalej: „ich möchte”.",
    },
  ];

  const form = document.querySelector("#niem-exercise");
  const inputs = [...form.querySelectorAll('input[type="text"]')];
  const result = document.querySelector("#niem-result");
  const solutions = document.querySelector("#niem-solutions");
  const normalise = (value) =>
    value.normalize("NFC").trim().toLocaleLowerCase("de").replaceAll("ß", "ss");
  let checked = false;

  function progress() {
    const count = inputs.filter((input) => input.value.trim()).length;
    document.querySelector("#niem-completed").textContent =
      `${count} / ${inputs.length}`;
    const meter = document.querySelector("#niem-progress");
    meter.value = count;
    meter.textContent = `${count} z ${inputs.length}`;
  }

  function clearFeedback(input) {
    const row = input.closest("li");
    delete row.dataset.state;
    input.removeAttribute("aria-invalid");
    const feedback = row.querySelector(".niem-feedback");
    feedback.hidden = true;
    feedback.textContent = "";
  }

  form.addEventListener("input", (event) => {
    if (!inputs.includes(event.target)) return;
    clearFeedback(event.target);
    progress();
    if (checked)
      result.textContent =
        "Odpowiedzi zmienione. Sprawdź ponownie, aby zaktualizować wynik.";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let correct = 0;
    let empty = 0;
    let firstIncorrect;
    inputs.forEach((input, index) => {
      const value = normalise(input.value);
      const ok = key[index].words.some((word) => normalise(word) === value);
      const row = input.closest("li");
      const feedback = row.querySelector(".niem-feedback");
      row.dataset.state = ok ? "correct" : value ? "wrong" : "empty";
      input.setAttribute("aria-invalid", String(!ok));
      feedback.hidden = false;
      feedback.textContent = ok
        ? `Dobrze. ${key[index].why}`
        : value
          ? "Jeszcze nie. Sprawdź polską podpowiedź i szyk zdania."
          : "Uzupełnij tę lukę jednym wyrazem ze ściągi.";
      if (ok) correct += 1;
      else firstIncorrect ??= input;
      if (!value) empty += 1;
    });
    checked = true;
    result.textContent =
      correct === inputs.length
        ? "Wynik: 20 / 20. Wszystkie połączenia pasują!"
        : `Wynik: ${correct} / ${inputs.length}. Błędne: ${inputs.length - correct - empty}. Puste: ${empty}. Popraw odpowiedzi i sprawdź ponownie.`;
    if (firstIncorrect) {
      firstIncorrect.focus({ preventScroll: true });
      firstIncorrect.scrollIntoView({ block: "center", behavior: "instant" });
    }
  });

  form.addEventListener("reset", () => {
    // Native reset happens after this event; recount in the next task.
    setTimeout(() => {
      checked = false;
      inputs.forEach(clearFeedback);
      progress();
      result.textContent = "Wpisz odpowiedzi, a potem sprawdź swój wynik.";
      solutions.open = false;
      inputs[0].focus();
    }, 0);
  });

  // Build the key on explicit opening; it never overwrites a learner's answer.
  solutions.addEventListener("toggle", () => {
    const list = document.querySelector("#niem-answer-key");
    if (!solutions.open || list.childElementCount) return;
    key.forEach((entry) => {
      const item = document.createElement("li");
      const word = document.createElement("strong");
      word.lang = "de";
      word.textContent = entry.words.join(" / ");
      const explanation = document.createElement("p");
      explanation.textContent = entry.why;
      item.append(word, explanation);
      list.append(item);
    });
  });

  const syncThemeColor = () => {
    document.querySelector('meta[name="theme-color"]').content =
      window.SpinnerTheme.mode === "dark" ? "#11140f" : "#f4f1e8";
  };
  window.addEventListener("spinner:theme-change", syncThemeColor);
  syncThemeColor();
  if (matchMedia("(min-width: 960px)").matches)
    document.querySelector("#niem-cheatsheet").open = true;
  document.querySelector("#niem-actions").hidden = false;
  solutions.hidden = false;
  progress();
})();
