(() => {
  "use strict";
  const vendorBase = new URL("vendor/", document.currentScript.src);
  const config = {
    apiKey: "AIzaSyByk8GJSoTJ_bgPNjyKnKi3o30E8bQB-qo",
    authDomain: "spinnerrealyt-games.firebaseapp.com",
    projectId: "spinnerrealyt-games",
  };
  // These old keys were presentation hints, never proof of authentication.
  try {
    localStorage.removeItem("sp_logged");
    localStorage.removeItem("sp_pass");
  } catch {
    /* Storage may be blocked. */
  }
  let authPromise,
    auth,
    user = null,
    mode = "login",
    busy = false;
  const dialog = document.createElement("dialog");
  dialog.id = "account-dialog";
  dialog.setAttribute("aria-labelledby", "account-title");
  dialog.innerHTML = `<button class="dialog-close" data-close aria-label="Zamknij panel konta">×</button><div class="dialog-kicker">TWOJE MIEJSCE W SALONIE</div><h2 id="account-title">Miło Cię widzieć.</h2><div id="account-message" class="message" role="status" aria-live="polite"></div><section id="auth-section"><p>Konto jest opcjonalne. Wszystkie gry działają też bez logowania.</p><button id="google-login" class="google-button"><span class="google-g" aria-hidden="true">G</span>Kontynuuj z Google</button><div class="form-divider">LUB PRZEZ E-MAIL</div><form id="auth-form"><label class="form-field" id="nickname-field" hidden>Jak Cię nazywać?<input name="nickname" autocomplete="nickname" maxlength="30"></label><label class="form-field">E-mail<input name="email" type="email" autocomplete="username" required maxlength="254"></label><label class="form-field" id="password-field">Hasło<input name="password" type="password" autocomplete="current-password" required maxlength="128"><small id="password-hint" hidden>Przy nowym koncie: co najmniej 8 znaków. Nie używaj hasła z innego serwisu.</small></label><p id="register-notice" hidden>Tworząc konto, zapoznaj się z <a class="link-button" href="prywatnosc.html">polityką prywatności</a> i <a class="link-button" href="zasady-serwisu.html">zasadami serwisu</a>. Sesja trwa do zamknięcia przeglądarki; wyniki gier pozostają lokalne.</p><button class="button primary full-width" id="auth-submit" type="submit">Zaloguj się <span>↗</span></button></form><div class="form-actions"><button id="auth-switch" class="link-button">Załóż konto</button><button id="password-reset" class="link-button">Nie pamiętasz hasła?</button></div><p>Masz starsze konto? Użyj adresu e-mail zamiast nicku.</p></section><section id="profile-section" hidden><div class="profile-details"><strong id="profile-name"></strong><br><span id="profile-email"></span><br><small id="profile-verification"></small></div><p>Wyniki i ulubione są zapisywane na urządzeniu po zgodzie. Konto nie synchronizuje ich w chmurze.</p><div class="form-actions"><button id="send-verification" class="link-button">Wyślij potwierdzenie e-mail</button><button id="profile-reset" class="link-button">Wyślij link zmiany hasła</button></div><hr><form id="email-form"><label class="form-field">Nowy adres e-mail<input name="newEmail" type="email" autocomplete="email" required></label><label class="form-field" id="email-password-field">Obecne hasło<input name="currentPassword" type="password" autocomplete="current-password"></label><button class="button full-width" type="submit">Zmień e-mail <span>↗</span></button></form><p>Zmiana adresu wymaga ponownego uwierzytelnienia i potwierdzenia nowego adresu.</p><button id="logout" class="button primary full-width">Wyloguj się <span>↗</span></button><details><summary>Usunięcie konta</summary><p>To trwale usuwa konto logowania. Zapis lokalny możesz usunąć osobno. Dane zapisane w starszej wersji serwisu zgłoś do usunięcia na kontakt@spinnerrealyt.pl.</p><form id="delete-form"><label class="form-field">Wpisz USUŃ, aby potwierdzić<input name="confirmation" required autocomplete="off" pattern="USUŃ"></label><label class="form-field" id="delete-password-field">Obecne hasło<input name="currentPassword" type="password" autocomplete="current-password"></label><button class="button danger-button full-width" type="submit">Trwale usuń konto</button></form></details></section>`;
  document.body.append(dialog);
  const $ = (selector) => dialog.querySelector(selector);
  function message(text, error = false) {
    $("#account-message").textContent = text;
    $("#account-message").classList.toggle("error", error);
  }
  const errors = {
    "auth/invalid-credential": "Adres lub hasło są nieprawidłowe.",
    "auth/wrong-password": "Adres lub hasło są nieprawidłowe.",
    "auth/user-not-found": "Adres lub hasło są nieprawidłowe.",
    "auth/email-already-in-use":
      "Nie udało się utworzyć konta z tym adresem. Spróbuj logowania lub resetu hasła.",
    "auth/invalid-email": "Podaj poprawny adres e-mail.",
    "auth/weak-password":
      "Wybierz silniejsze hasło, mające co najmniej 8 znaków.",
    "auth/too-many-requests":
      "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.",
    "auth/popup-closed-by-user":
      "Okno logowania zostało zamknięte. Możesz spróbować ponownie.",
    "auth/popup-blocked":
      "Przeglądarka zablokowała okno Google. Zezwól na wyskakujące okno dla tej strony.",
    "auth/cancelled-popup-request": "Dokończ logowanie w otwartym oknie.",
    "auth/unauthorized-domain":
      "Logowanie nie jest jeszcze dostępne pod tym adresem strony. Skontaktuj się z kontakt@spinnerrealyt.pl.",
    "auth/operation-not-allowed":
      "Ta metoda logowania nie jest włączona. Spróbuj innej lub napisz na kontakt@spinnerrealyt.pl.",
    "auth/network-request-failed":
      "Nie można połączyć się z usługą logowania. Sprawdź połączenie i spróbuj ponownie.",
    "auth/requires-recent-login": "Zaloguj się ponownie przed zmianą danych.",
    "auth/user-disabled":
      "Konto zostało wyłączone. Napisz na kontakt@spinnerrealyt.pl.",
    "auth/account-exists-with-different-credential":
      "Dla tego adresu istnieje konto z inną metodą logowania. Użyj dotychczasowej metody.",
  };
  function report(error) {
    message(
      errors[error.code] ||
        "Nie udało się wykonać operacji. Spróbuj ponownie lub skontaktuj się z kontakt@spinnerrealyt.pl.",
      true,
    );
  }
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("sdk-timeout"));
      }, 15000);
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("sdk-load"));
      };
      document.head.append(script);
    });
  }
  function initialize() {
    if (!navigator.onLine)
      return Promise.reject({ code: "auth/network-request-failed" });
    if (!authPromise)
      authPromise = (async () => {
        if (!window.firebase?.initializeApp)
          await loadScript(new URL("firebase-app-compat.js", vendorBase).href);
        if (!window.firebase?.auth)
          await loadScript(new URL("firebase-auth-compat.js", vendorBase).href);
        const app =
          firebase.apps.find((app) => app.name === "spinner-account") ||
          firebase.initializeApp(config, "spinner-account");
        auth = app.auth();
        auth.languageCode = "pl";
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        await new Promise((resolve) => {
          let first = true;
          auth.onAuthStateChanged((current) => {
            user = current;
            renderUser();
            if (first) {
              first = false;
              resolve();
            }
          });
        });
        return auth;
      })().catch((error) => {
        authPromise = null;
        throw error;
      });
    return authPromise;
  }
  function renderUser() {
    try {
      if (user) sessionStorage.setItem("spinner:auth-active", "1");
      else sessionStorage.removeItem("spinner:auth-active");
    } catch {
      /* No persistence available. */
    }
    document
      .querySelectorAll("[data-account-label]")
      .forEach(
        (el) =>
          (el.textContent = user
            ? user.displayName || "Moje konto"
            : "Twoje konto"),
      );
    $("#auth-section").hidden = Boolean(user);
    $("#profile-section").hidden = !user;
    $("#account-title").textContent = user
      ? "Twoje konto."
      : mode === "register"
        ? "Dołącz do salonu."
        : mode === "reset"
          ? "Nowy początek."
          : "Miło Cię widzieć.";
    if (user) {
      $("#profile-name").textContent = user.displayName || "Gracz";
      $("#profile-email").textContent = user.email || "";
      $("#profile-verification").textContent = user.emailVerified
        ? "Adres e-mail potwierdzony"
        : "Adres e-mail czeka na potwierdzenie";
      $("#send-verification").hidden = user.emailVerified;
      const password = user.providerData.some(
        (provider) => provider.providerId === "password",
      );
      $("#profile-reset").hidden = !password;
      for (const id of ["#email-password-field", "#delete-password-field"]) {
        $(id).hidden = !password;
        $(id + " input").required = password;
      }
    }
  }
  function setMode(next) {
    mode = next;
    message("");
    $("#nickname-field").hidden = next !== "register";
    $("#password-field").hidden = next === "reset";
    $("#password-field input").required = next !== "reset";
    $("#password-field input").minLength = next === "register" ? 8 : 1;
    $("#password-field input").autocomplete =
      next === "register" ? "new-password" : "current-password";
    $("#password-field input").value = "";
    $("#password-hint").hidden = next !== "register";
    $("#register-notice").hidden = next !== "register";
    $("#google-login").hidden = next === "reset";
    $("#password-reset").hidden = next === "reset";
    $("#auth-submit").textContent =
      next === "register"
        ? "Utwórz konto ↗"
        : next === "reset"
          ? "Wyślij link resetowania ↗"
          : "Zaloguj się ↗";
    $("#auth-switch").textContent =
      next === "login" ? "Załóż konto" : "Wróć do logowania";
    renderUser();
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    message("Łączenie z usługą konta…");
    dialog
      .querySelectorAll("button:not([data-close])")
      .forEach((button) => (button.disabled = true));
    try {
      await action();
    } catch (error) {
      report(error);
    } finally {
      busy = false;
      dialog
        .querySelectorAll("button")
        .forEach((button) => (button.disabled = false));
    }
  }
  async function reauthenticate(password) {
    if (!user) throw new Error("signed-out");
    if (
      user.providerData.some((provider) => provider.providerId === "password")
    ) {
      await user.reauthenticateWithCredential(
        firebase.auth.EmailAuthProvider.credential(user.email, password),
      );
    } else
      await user.reauthenticateWithPopup(
        new firebase.auth.GoogleAuthProvider(),
      );
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-account]")) {
      dialog.showModal();
      if (!navigator.onLine) {
        message(
          "Jesteś offline. Gry działają bez konta; połącz się z internetem, aby skorzystać z logowania.",
          true,
        );
        return;
      }
      run(async () => {
        await initialize();
        message("");
      });
    }
  });
  $("#auth-switch").onclick = () =>
    setMode(mode === "login" ? "register" : "login");
  $("#password-reset").onclick = () => setMode("reset");
  $("#google-login").onclick = () =>
    run(async () => {
      const instance = await initialize();
      await instance.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      message("Jesteś zalogowany. Dobrej gry!");
    });
  $("#auth-form").onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(async () => {
      const instance = await initialize();
      const email = String(data.get("email")).trim();
      // Passwords are intentionally not trimmed or stored by application code.
      const password = String(data.get("password") || "");
      if (mode === "reset") {
        try {
          await instance.sendPasswordResetEmail(email);
        } catch (error) {
          if (error.code !== "auth/user-not-found") throw error;
        }
        message(
          "Jeżeli konto istnieje i korzysta z hasła, otrzymasz link resetowania. Sprawdź też folder spam.",
        );
      } else if (mode === "register") {
        if (password.length < 8) {
          message("Hasło musi mieć co najmniej 8 znaków.", true);
          return;
        }
        const result = await instance.createUserWithEmailAndPassword(
          email,
          password,
        );
        const nickname = String(data.get("nickname") || "")
          .trim()
          .slice(0, 30);
        if (nickname)
          await result.user.updateProfile({ displayName: nickname });
        renderUser();
        try {
          await result.user.sendEmailVerification();
          message(
            "Konto utworzone. Wysłaliśmy wiadomość potwierdzającą adres.",
          );
        } catch {
          message(
            "Konto utworzone, ale wiadomość nie została wysłana. Użyj „Wyślij potwierdzenie e-mail”.",
            true,
          );
        }
      } else {
        await instance.signInWithEmailAndPassword(email, password);
        message("Jesteś zalogowany. Dobrej gry!");
      }
      $("#auth-form [name=password]").value = "";
    });
  };
  $("#logout").onclick = () =>
    run(async () => {
      await auth.signOut();
      setMode("login");
      message("Wylogowano. Twoje ustawienia cookies pozostały bez zmian.");
    });
  $("#send-verification").onclick = () =>
    run(async () => {
      await user.sendEmailVerification();
      message(
        "Wysłaliśmy wiadomość potwierdzającą. Sprawdź skrzynkę i folder spam.",
      );
    });
  $("#profile-reset").onclick = () =>
    run(async () => {
      await auth.sendPasswordResetEmail(user.email);
      message("Wysłaliśmy link zmiany hasła na adres konta.");
    });
  $("#email-form").onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(async () => {
      await reauthenticate(String(data.get("currentPassword") || ""));
      await user.verifyBeforeUpdateEmail(String(data.get("newEmail")).trim());
      $("#email-form").reset();
      message("Potwierdź nowy adres, korzystając z wysłanej wiadomości.");
    });
  };
  $("#delete-form").onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("confirmation") !== "USUŃ") return;
    run(async () => {
      await reauthenticate(String(data.get("currentPassword") || ""));
      await user.delete();
      $("#delete-form").reset();
      setMode("login");
      message("Konto logowania zostało usunięte.");
    });
  };
  dialog.addEventListener("close", () => {
    dialog
      .querySelectorAll("input[type=password]")
      .forEach((input) => (input.value = ""));
    if (!busy) message("");
  });
  // Resume only an explicitly requested account session; never load third-party SDKs for ordinary browsing.
  try {
    if (sessionStorage.getItem("spinner:auth-active") === "1")
      initialize().catch(() => {});
  } catch {
    /* Session storage unavailable. */
  }
})();
