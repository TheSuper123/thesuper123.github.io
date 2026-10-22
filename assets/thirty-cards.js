(() => {
  "use strict";
  window.SpinnerCards = {
    create(mode) {
      const isFree = mode === "freecell";
      const S = SpinnerThirty,
        H = S.create([
          "RUCHY",
          "FUNDAMENTY",
          isFree ? "WOLNE KOMÓRKI" : "TALIA",
        ]);
      H.board.className = "th-board-cards";
      H.board.dataset.aspect = "1.15";
      let s,
        history = [];
      const undoButton = H.button("Cofnij", undo);
      function newGame() {
        const deck = S.shuffle(Array.from({ length: 52 }, (_, i) => i)),
          columns = [];
        if (isFree) {
          for (let c = 0; c < 8; c++) columns.push([]);
          deck.forEach((card, i) => columns[i % 8].push({ card, up: true }));
          deck.length = 0;
        } else
          for (let c = 0; c < 7; c++)
            columns.push(
              Array.from({ length: c + 1 }, (_, i) => ({
                card: deck.pop(),
                up: i === c,
              })),
            );
        s = {
          columns,
          stock: deck,
          waste: [],
          found: Array.from({ length: 4 }, () => []),
          free: Array(4).fill(null),
          selected: null,
          moves: 0,
        };
        history = [];
        H.reset();
        H.say(
          isFree
            ? "Wolne komórki pomagają przenosić sekwencje. Fundamenty zaczynaj od asów."
            : "Odkrywaj talię po jednej karcie. Kolumny maleją naprzemiennymi kolorami.",
        );
        render();
      }
      function source(src) {
        if (!src) return [];
        if (src.type === "col")
          return (s.columns[src.col] || []).slice(src.index).map((v) => v.card);
        if (src.type === "waste") return s.waste.length ? [s.waste.at(-1)] : [];
        if (src.type === "free")
          return s.free[src.col] === null ? [] : [s.free[src.col]];
        if (src.type === "found")
          return s.found[src.col].length ? [s.found[src.col].at(-1)] : [];
        return [];
      }
      function validRun(src) {
        if (src.type !== "col") return source(src).length === 1;
        const stack = s.columns[src.col]?.slice(src.index);
        return (
          stack?.length &&
          stack.every(
            (v, i) =>
              v.up &&
              (!i ||
                (S.rank(stack[i - 1].card) === S.rank(v.card) + 1 &&
                  S.red(stack[i - 1].card) !== S.red(v.card))),
          )
        );
      }
      function legalMove(src, dst) {
        const cards = source(src);
        if (
          !cards.length ||
          !validRun(src) ||
          (src.type === dst.type && src.col === dst.col)
        )
          return false;
        const first = cards[0];
        if (dst.type === "found")
          return (
            cards.length === 1 &&
            S.suit(first) === dst.col &&
            S.rank(first) === s.found[dst.col].length + 1
          );
        if (dst.type === "free")
          return isFree && cards.length === 1 && s.free[dst.col] === null;
        if (dst.type !== "col" || !s.columns[dst.col]) return false;
        const dest = s.columns[dst.col].at(-1);
        if (
          dest &&
          (!dest.up ||
            S.rank(dest.card) !== S.rank(first) + 1 ||
            S.red(dest.card) === S.red(first))
        )
          return false;
        if (!dest && !isFree && S.rank(first) !== 13) return false;
        if (isFree && cards.length > 1) {
          const free = s.free.filter((v) => v === null).length,
            empty = s.columns.filter(
              (col, i) => !col.length && i !== dst.col,
            ).length;
          return cards.length <= (free + 1) * 2 ** empty;
        }
        return true;
      }
      function move(src, dst) {
        if (!H.active() || !legalMove(src, dst)) return false;
        H.start();
        history.push(S.clone(s));
        const cards = source(src);
        if (src.type === "col") {
          s.columns[src.col].splice(src.index);
          const last = s.columns[src.col].at(-1);
          if (last) last.up = true;
        } else if (src.type === "waste") s.waste.pop();
        else if (src.type === "free") s.free[src.col] = null;
        else s.found[src.col].pop();
        if (dst.type === "col")
          s.columns[dst.col].push(...cards.map((card) => ({ card, up: true })));
        else if (dst.type === "free") s.free[dst.col] = cards[0];
        else s.found[dst.col].push(cards[0]);
        s.selected = null;
        s.moves++;
        if (s.found.every((stack) => stack.length === 13))
          H.finish(`Wszystkie kolory od asa do króla. ${s.moves} ruchów!`);
        render();
        return true;
      }
      function choose(src) {
        if (!H.active()) return;
        if (s.selected && move(s.selected, { type: src.type, col: src.col }))
          return;
        if (validRun(src)) {
          s.selected =
            JSON.stringify(src) === JSON.stringify(s.selected) ? null : src;
          H.say("Wybierz kolumnę, komórkę lub fundament docelowy.");
          render();
        }
      }
      function draw() {
        if (!H.active() || isFree) return false;
        if (!s.stock.length && !s.waste.length) return false;
        H.start();
        history.push(S.clone(s));
        if (s.stock.length) s.waste.push(s.stock.pop());
        else {
          s.stock = [...s.waste].reverse();
          s.waste = [];
        }
        s.selected = null;
        s.moves++;
        render();
        return true;
      }
      function undo() {
        return S.undo(H, history, (value) => {
          s = value;
          s.selected = null;
        });
      }
      function render() {
        const height = H.board.clientHeight || 450;
        H.board.replaceChildren();
        const top = document.createElement("div");
        top.className = "th-card-top";
        if (isFree) {
          for (let i = 0; i < 4; i++) {
            const slot = document.createElement("div");
            slot.className = "th-slot";
            if (s.free[i] === null)
              H.button(
                "＋",
                () => {
                  if (s.selected) move(s.selected, { type: "free", col: i });
                },
                slot,
              );
            else
              S.cardButton(
                H,
                s.free[i],
                () => choose({ type: "free", col: i }),
                slot,
              );
            top.append(slot);
          }
        } else {
          const stock = document.createElement("div");
          stock.className = "th-slot";
          H.button(s.stock.length ? "✳ " + s.stock.length : "↻", draw, stock);
          stock.setAttribute("aria-label", "Talia dobierania");
          const waste = document.createElement("div");
          waste.className = "th-slot";
          if (s.waste.length)
            S.cardButton(
              H,
              s.waste.at(-1),
              () => choose({ type: "waste" }),
              waste,
            );
          top.append(stock, waste);
        }
        for (let i = 0; i < 4; i++) {
          const slot = document.createElement("div");
          slot.className = "th-slot";
          slot.dataset.foundation = i;
          if (s.found[i].length)
            S.cardButton(
              H,
              s.found[i].at(-1),
              () => {
                if (s.selected) move(s.selected, { type: "found", col: i });
                else choose({ type: "found", col: i });
              },
              slot,
            );
          else
            H.button(
              ["♠", "♥", "♦", "♣"][i],
              () => {
                if (s.selected) move(s.selected, { type: "found", col: i });
              },
              slot,
            );
          top.append(slot);
        }
        const columns = document.createElement("div");
        columns.className = "th-columns";
        columns.style.setProperty("--columns", s.columns.length);
        s.columns.forEach((stack, c) => {
          const col = document.createElement("div");
          col.className = "th-column";
          col.dataset.column = c;
          col.setAttribute("role", "group");
          col.setAttribute("aria-label", `Kolumna ${c + 1}`);
          col.onclick = () => {
            if (s.selected) move(s.selected, { type: "col", col: c });
          };
          if (!stack.length) {
            const b = H.button(
              "＋",
              () => {
                if (s.selected) move(s.selected, { type: "col", col: c });
              },
              col,
            );
            b.style.width = "100%";
          }
          const step = Math.max(
            2,
            Math.min(25, (height - 135) / Math.max(1, stack.length - 1)),
          );
          stack.forEach((v, i) => {
            const b = S.cardButton(
              H,
              v.card,
              (e) => choose({ type: "col", col: c, index: i }),
              col,
              !v.up,
            );
            b.style.top = i * step + "px";
            b.dataset.selected = String(
              s.selected?.type === "col" &&
                s.selected.col === c &&
                s.selected.index === i,
            );
            b.onclick = (e) => {
              e.stopPropagation();
              choose({ type: "col", col: c, index: i });
            };
          });
          columns.append(col);
        });
        H.board.append(top, columns);
        H.stats([
          s.moves,
          s.found.reduce((a, b) => a + b.length, 0) + " / 52",
          isFree
            ? s.free.filter((v) => v === null).length + " wolne"
            : s.stock.length,
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
      const api = S.api(
        H,
        { move, choose, draw, undo, legalMove, source, getState: () => s },
        () => s,
      );
      newGame();
      new ResizeObserver(() => render()).observe(H.board);
      return api;
    },
  };
})();
