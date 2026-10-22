(() => {
  "use strict";
  window.SpinnerLatin = {
    create(mode) {
      const S = SpinnerThirty,
        n = mode === "cages" ? 4 : 5,
        H = S.create(["CZAS", "WYPEŁNIONE", "KONFLIKTY"]);
      let s,
        history = [];
      H.board.classList.add("th-latin-grid");
      const undoButton = H.button("Cofnij", undo);
      H.button("Sprawdź", () =>
        H.say(
          valid(s.board)
            ? "Wszystkie warunki spełnione."
            : `Konflikty cyfr: ${conflicts(s.board)}. Sprawdź też wskazówki przy planszy.`,
        ),
      );
      S.pad(H, n, enter);
      const seen = (row) => {
        let max = 0,
          count = 0;
        for (const v of row)
          if (v > max) {
            max = v;
            count++;
          }
        return count;
      };
      function conflicts(b) {
        let count = 0;
        for (const row of S.lines(b, n)) {
          const values = row.filter(Boolean);
          count += values.length - new Set(values).size;
        }
        return count;
      }
      function cages(solution) {
        const left = new Set(solution.map((_, i) => i)),
          out = [];
        while (left.size) {
          const a = [...left][0];
          left.delete(a);
          const r = Math.floor(a / n),
            c = a % n,
            neighbors = [
              a - n,
              a + n,
              c ? a - 1 : -1,
              c < n - 1 ? a + 1 : -1,
            ].filter((i) => i >= 0 && i < n * n && left.has(i));
          let cells = [a];
          if (neighbors.length && Math.random() < 0.85) {
            const b = neighbors[Math.floor(Math.random() * neighbors.length)];
            left.delete(b);
            cells.push(b);
          }
          const values = cells.map((i) => solution[i]);
          let op = "",
            target = values[0];
          if (values.length === 2) {
            op = ["+", "×", "−"][Math.floor(Math.random() * 3)];
            target =
              op === "+"
                ? values[0] + values[1]
                : op === "×"
                  ? values[0] * values[1]
                  : Math.abs(values[0] - values[1]);
          }
          out.push({ cells, op, target });
        }
        return out;
      }
      function valid(b) {
        if (!S.latin(b, n)) return false;
        if (mode === "futoshiki")
          return s.inequalities.every((e) =>
            e.less ? b[e.a] < b[e.b] : b[e.a] > b[e.b],
          );
        if (mode === "skyscrapers")
          return Array.from({ length: n }, (_, i) => {
            const row = b.slice(i * n, i * n + n),
              col = Array.from({ length: n }, (_, r) => b[r * n + i]);
            return (
              seen(row) === s.clues.left[i] &&
              seen([...row].reverse()) === s.clues.right[i] &&
              seen(col) === s.clues.top[i] &&
              seen([...col].reverse()) === s.clues.bottom[i]
            );
          }).every(Boolean);
        return s.cages.every((c) => {
          const values = c.cells.map((i) => b[i]);
          return (
            (c.op === "+"
              ? values.reduce((a, b) => a + b, 0)
              : c.op === "×"
                ? values.reduce((a, b) => a * b, 1)
                : c.op === "−"
                  ? Math.abs(values[0] - values[1])
                  : values[0]) === c.target
          );
        });
      }
      function newGame() {
        const solution = S.latinBoard(n),
          fixed = solution.map(() => mode !== "cages" && Math.random() < 0.22);
        fixed[0] = mode !== "cages";
        s = {
          solution,
          fixed,
          board: solution.map((v, i) => (fixed[i] ? v : 0)),
          selected: fixed.findIndex((v) => !v),
          moves: 0,
          inequalities: [],
          cages: [],
          clues: { top: [], bottom: [], left: [], right: [] },
        };
        if (mode === "futoshiki")
          for (let i = 0; i < n * n; i++)
            for (const j of [
              i % n < n - 1 ? i + 1 : -1,
              i + n < n * n ? i + n : -1,
            ])
              if (j >= 0 && Math.random() < 0.5)
                s.inequalities.push({
                  a: i,
                  b: j,
                  less: solution[i] < solution[j],
                });
        if (mode === "skyscrapers")
          for (let i = 0; i < n; i++) {
            const row = solution.slice(i * n, i * n + n),
              col = Array.from({ length: n }, (_, r) => solution[r * n + i]);
            s.clues.left.push(seen(row));
            s.clues.right.push(seen([...row].reverse()));
            s.clues.top.push(seen(col));
            s.clues.bottom.push(seen([...col].reverse()));
          }
        if (mode === "cages") s.cages = cages(solution);
        history = [];
        H.reset();
        H.say(
          mode === "skyscrapers"
            ? "Wysoki budynek zasłania niższe za sobą."
            : mode === "cages"
              ? "Cyfry nie powtarzają się w linii, a klatki muszą dać podany wynik."
              : "Wpisz cyfry i spełnij wszystkie znaki nierówności.",
        );
        render();
      }
      function enter(value) {
        const i = s.selected;
        if (
          !H.active() ||
          s.fixed[i] ||
          !Number.isInteger(value) ||
          value < 0 ||
          value > n
        )
          return false;
        H.start();
        history.push(S.clone(s));
        s.board[i] = value;
        s.moves++;
        if (valid(s.board))
          H.finish(`Wszystkie warunki spełnione. ${s.moves} wpisów!`);
        render();
        return true;
      }
      function choose(i) {
        if (i >= 0 && i < n * n) {
          s.selected = i;
          render();
        }
      }
      function undo() {
        S.undo(H, history, (value) => (s = value));
      }
      function render() {
        const size = mode === "skyscrapers" ? n + 2 : n,
          indices = Array.from({ length: size * size }, (_, i) => {
            if (size === n) return i;
            const r = Math.floor(i / size) - 1,
              c = (i % size) - 1;
            return r >= 0 && r < n && c >= 0 && c < n ? r * n + c : -1;
          });
        const labels = indices.map((v, i) => {
          if (v >= 0) return s.board[v] ? String(s.board[v]) : "";
          const r = Math.floor(i / size),
            c = i % size;
          if (r === 0 && c > 0 && c <= n) return s.clues.top[c - 1];
          if (r === size - 1 && c > 0 && c <= n) return s.clues.bottom[c - 1];
          if (c === 0 && r > 0 && r <= n) return s.clues.left[r - 1];
          if (c === size - 1 && r > 0 && r <= n) return s.clues.right[r - 1];
          return "";
        });
        H.grid(
          size,
          labels,
          (i) => {
            if (H.active() && indices[i] >= 0) choose(indices[i]);
          },
          (b, i) => {
            const j = indices[i];
            if (j < 0) {
              b.disabled = true;
              b.classList.add("th-clue-cell");
              return;
            }
            b.dataset.cell = j;
            b.dataset.selected = String(j === s.selected);
            b.dataset.fixed = String(s.fixed[j]);
            b.style.color = s.fixed[j] ? "var(--ink)" : "var(--orange)";
            b.onfocus = () => (s.selected = j);
            b.setAttribute(
              "aria-label",
              `Pole ${Math.floor(j / n) + 1}, ${(j % n) + 1}: ${s.board[j] || "puste"}${s.fixed[j] ? ", stałe" : ""}`,
            );
            if (mode === "futoshiki")
              for (const e of s.inequalities.filter((e) => e.a === j)) {
                const span = document.createElement("span");
                span.className = e.b === j + 1 ? "th-less" : "th-down";
                span.textContent =
                  e.b === j + 1 ? (e.less ? "<" : ">") : e.less ? "∧" : "∨";
                span.setAttribute(
                  "aria-label",
                  e.less ? "mniejsze od sąsiedniego" : "większe od sąsiedniego",
                );
                b.append(span);
              }
            if (mode === "cages") {
              const index = s.cages.findIndex((c) => c.cells.includes(j)),
                c = s.cages[index];
              b.classList.add("th-sector-" + (index % 4));
              if (c.cells[0] === j) {
                const span = document.createElement("span");
                span.className = "th-clue";
                span.textContent = c.target + c.op;
                b.append(span);
              }
              b.setAttribute(
                "aria-label",
                b.getAttribute("aria-label") + `, klatka ${c.target}${c.op}`,
              );
            }
          },
        );
        H.stats([
          S.time(H.elapsed),
          s.board.filter(Boolean).length + " / " + n * n,
          conflicts(s.board),
        ]);
        undoButton.disabled = !history.length || H.phase === "paused";
      }
      H.keys((key, e) => {
        if (key.toLowerCase() === "u" && !e.repeat) {
          undo();
          return true;
        }
      });
      H.onNew = newGame;
      H.onRender = render;
      H.onTick = () =>
        H.stats([
          S.time(H.elapsed),
          s.board.filter(Boolean).length + " / " + n * n,
          conflicts(s.board),
        ]);
      const api = S.api(
        H,
        {
          enter,
          choose,
          undo,
          valid,
          seen,
          conflicts,
          generate: () => S.latinBoard(n),
        },
        () => s,
      );
      newGame();
      return api;
    },
  };
})();
