# Przygotowanie do AdSense

Przegląd kodu: 24 października 2026. Doprecyzowanie zakresu: 30 października 2026 — właściciel potwierdził, że chodzi o wyświetlanie reklam AdSense w serwisie.

Nie potwierdzono pełnej zgodności ani zatwierdzenia przez Google. Wykonano przegląd kodu, poprawki publicznej wersji i testy lokalne. Strona nadal nie wyświetla reklam ani analityki. Nie dodawano numeru wydawcy, fikcyjnego `ads.txt`, kodu reklam ani komunikatu udającego certyfikowaną CMP.

Ten raport dotyczy AdSense. Sama liczba gier, panel cookies, regulamin lub sitemap nie zapewniają akceptacji; Google ocenia m.in. treść, faktyczne działanie witryny, sposób pozyskiwania ruchu i konto wydawcy.

## Co sprawdzono i zmieniono

| Obszar | Stan po zmianach | Granica weryfikacji |
| --- | --- | --- |
| Treść i nawigacja | Pełny katalog 101 gier jest w HTML. Biblioteka `gry.html` opisuje rzeczywiste zasady i sterowanie wszystkich pozycji bez uruchamiania skryptów. W wersji JS karty zachowują wyszukiwanie, ulubione i szybki odtwarzacz. | To poprawa użyteczności i dostępności treści, nie gwarancja oceny jakości przez Google. |
| Materiały o niepotwierdzonych prawach | `others/`, dawne prototypy i strona „wkrótce” są wyłączone z publikacji przez `_config.yml`. Usunięto odnośniki i automatyczne przekierowanie z publicznego odtwarzacza do archiwum. | Zaszyfrowane kopie pozostają w repozytorium do wyjaśnienia praw. Nie usunięto historii Git ani wcześniejszych kopii i publikacji. Hasło nie daje licencji. |
| Zgody lokalne | Równorzędny wybór, brak opcjonalnego zapisu bez zgody, odrzucanie przyszłych dat, wygasanie po 180 dniach również w otwartej karcie oraz cofnięcie po czyszczeniu danych w innej karcie. | Ten mechanizm dotyczy wyłącznie preferencji i wyników serwisu. Nie jest certyfikowaną CMP ani zgodą na reklamy Google. |
| Prywatność i kontakt | Publiczne dane prowadzącego otrzymane od właściciela: Marcel Jaroszewski, kontakt@spinnerrealyt.pl. Uaktualniono politykę, dodano kontakt i zasady korzystania oraz link do zasad przed rejestracją. | Nie testowano doręczenia poczty. Sytuacji prawnej działalności, retencji dostawców i rzeczywistych ustawień Firebase nie można potwierdzić samym kodem. |
| Reklamy i ruch | Brak kodu AdSense, pikseli reklamowych, obietnic nagród pieniężnych i zachęt do klikania reklam. W grach nie ma płatności, zakładów ani wypłat punktów. | Nie oceniano historycznego ruchu, kampanii ani Centrum zasad Google; brak dostępu do konta. |
| Miejsce docelowe | Dodano prawdziwą stronę 404, sitemap, spójne adresy kanoniczne i pełną nawigację. Publiczne pliki oraz odnośniki przechodzą sprawdzenie lokalnej publikacji. | Nie potwierdza to DNS, HTTPS, dostępności domeny w poszczególnych krajach ani dostępu rzeczywistych robotów Google. |
| Funkcje serwisu | Testowane są gry bez konta, wariant bez JS, wersja mobilna, zgody, odtwarzacz i pakiet offline. | Operacje logowania mają testy z symulowanymi odpowiedziami Firebase; nie modyfikowano kont produkcyjnych. |

## Przed uruchomieniem AdSense

1. Na własnym koncie AdSense sprawdzić Centrum zasad, kwalifikację właściciela konta, weryfikację tożsamości oraz dodanie właściwej domeny. Nie wpisywać danych prywatnych, dokumentów ani haseł do publicznego repozytorium.
2. Potwierdzić prawa do używanych materiałów. Archiwum wycofane z witryny pozostaje do weryfikacji; jego usunięcie z bieżącej publikacji nie rozstrzyga praw do dawnych kopii.
3. Dla emisji podlegającej wymaganiom Google w EOG, Wielkiej Brytanii i Szwajcarii skonfigurować aktualnie certyfikowaną przez Google CMP z właściwą integracją IAB TCF, np. odpowiedni komunikat w panelu „Prywatność i wyświetlanie wiadomości” AdSense. Własny lokalny przełącznik preferencji tego nie zastępuje.
4. Dopiero po uzyskaniu rzeczywistego identyfikatora wydawcy i ustawieniu zgód wdrożyć wybraną metodę weryfikacji oraz kod reklam; dodać poprawny `ads.txt`, jeśli jest wymagany lub zalecany w danej konfiguracji. Nie odtwarzać niezweryfikowanych identyfikatorów z historii repozytorium.
5. Osobno zaprojektować miejsca emisji. Nie umieszczać reklam na planszy, pod sterowaniem, na przyciskach instalacji, w oknach dialogowych, przy błędach, podczas ładowania ani na wycofanych materiałach. Włączenie automatycznych reklam bez sprawdzenia ekranów gry nie jest objęte tym audytem. Dopasować wtedy politykę prywatności i usunąć nieaktualne obietnice „bez reklam”.
6. Ustalić charakter i wiek odbiorców. Jeżeli serwis lub jego część podlega zasadom dotyczącym dzieci, zastosować odpowiednie ograniczenia w koncie i emisji. Zwykły napis o wieku nie zastępuje tej oceny.
7. Nie wykorzystywać odpowiedzi kompasu politycznego ani wniosków o poglądach do profilowania reklamowego. Aktualny kod ich nie utrwala ani nie wysyła do pomiaru reklam.

## Konkretny plan integracji AdSense

Do dalszej konfiguracji potrzebne są rzeczywisty publiczny identyfikator `ca-pub-…` i status domeny w sekcji **Witryny** AdSense, w tym dokładny komunikat ewentualnego odrzucenia. Nie pobierać numeru z cudzej witryny ani odtwarzać starego identyfikatora bez potwierdzenia właściciela. Sam identyfikator nie daje dostępu do konta. Haseł, dokumentów tożsamości ani danych płatniczych nie należy przesyłać do repozytorium lub rozmowy.

| Etap | Konkretna czynność | Warunek zakończenia |
| --- | --- | --- |
| Konto i domena | Właściciel dodaje domenę `spinnerrealyt.pl` w AdSense i przekazuje publiczny identyfikator oraz wskazaną w panelu metodę weryfikacji. Weryfikację można przygotować oddzielnie od emisji reklam. | Panel potwierdza weryfikację domeny; samo umieszczenie kodu nie oznacza zatwierdzenia witryny. |
| Weryfikacja w kodzie | Wdrożyć wybraną metodę zgodnie z instrukcją z tego konta. Jeśli panel wskazuje `ads.txt`, użyć dokładnego autoryzowanego wpisu. Dodać plik do kontrolowanej publikacji w `scripts/build_public_site.py`; obecnie taki plik celowo nie istnieje. | Wskazany plik lub znacznik jest publicznie dostępny, a AdSense odczytuje go pod właściwą domeną. |
| Zgody reklamowe | Właściciel konfiguruje certyfikowaną CMP, np. właściwy komunikat w AdSense → **Prywatność i wyświetlanie wiadomości**. Zintegrować otrzymaną konfigurację i możliwość ponownego otwarcia ustawień. Zgoda na lokalne wyniki nie może włączać reklam. | Sprawdzone nowe wejście, odmowa, wybory szczegółowe i cofnięcie zgody na rzeczywistym wdrożeniu, zgodnie z wybraną CMP i aktualnymi zasadami Google. |
| Pierwsze miejsce reklamowe | Proponowany początek: jedno oznaczone miejsce w treści katalogu `index.html`, z rezerwacją wysokości i odstępem od kart oraz przycisków. Nie dodawać pustego boksu reklamowego przed rzeczywistą integracją. | Reklama nie zasłania treści, nie przesuwa sterowania i nie daje się pomylić z kartą gry. Sprawdzone oba motywy i mały ekran. |
| Wyłączenia | W tej konfiguracji pozostawić bez reklam same gry, `gra.html`, szybki odtwarzacz, kompas, logowanie, instalację, dokumenty informacyjne, ekran offline i błędy. Sprawdzić wyłączenia także w panelu, jeżeli będą używane reklamy automatyczne. | Brak emisji w ramkach gier, dialogach i przy sterowaniu. To przyjęty plan rozmieszczenia dla tej witryny, a nie twierdzenie, że Google zawsze zabrania reklam na każdej wymienionej stronie. |
| Treść i pamięć offline | Przy włączaniu emisji usunąć nieaktualne hasła „bez reklam”, uzupełnić politykę o faktycznych dostawców i przetwarzanie oraz zmienić kontrolę publikacji świadomie dopuszczającą wybraną integrację. Nie dodawać skryptów reklam, reklam ani sygnałów zgody do pakietu offline. | Lokalny wybór preferencji pozostaje niezależny; bez sieci nie są odtwarzane zapisane reklamy. Testy PWA i zgód nadal przechodzą. |
| Ocena Google | Właściciel zgłasza witrynę do oceny w sekcji **Witryny**, zgodnie ze statusem widocznym na swoim koncie. | Decyzja widoczna w AdSense. Żaden test tego repozytorium jej nie zastępuje. |

Aktualnie można potwierdzić przygotowanie kodu opisane w raporcie. Integracja z konkretnym kontem, certyfikowana CMP, emisja i zatwierdzenie przez Google pozostają niewykonane. Nie należy przedstawiać strony jako już zaakceptowanej przez AdSense.

## Publikacja i utrzymanie

Weryfikacja lokalna zakończyła się powodzeniem dla 60 różnych scenariuszy: 9 publikacji i zgód, 10 PWA, 17 odkrywania i szybkiego odtwarzacza, 12 podstawowych funkcji, 4 integracji odtwarzacza oraz 8 szyfrowania archiwum. Wykryte poziome przewijanie na 320 px i niestabilny efekt najechania na przycisk w dialogu zostały poprawione; odpowiednie scenariusze ponowiono z wynikiem pozytywnym. Test PWA uruchomił wszystkie 101 pozycji bez sieci. To wyniki testów kodu, a nie potwierdzenie zasad lub decyzji Google.

GitHub Pages ma używać budowania Jekyll z konfiguracją `_config.yml`. Plik celowo ma składnię JSON, będącą poprawnym podzbiorem YAML. Usunięto `.nojekyll`, który wcześniej powodował kopiowanie całego drzewa z pominięciem wykluczeń. Nie należy go odtwarzać. Folderów z kopiami do przeglądu nie wolno dodawać do publicznej listy.

```sh
python3 scripts/build_public_content.py
python3 scripts/build_offline_pack.py
python3 scripts/build_public_content.py --check
python3 scripts/build_offline_pack.py --check
python3 scripts/build_public_site.py
python3 tests/test_public_site.py
```

Opcja `python3 scripts/build_public_site.py --output /tmp/nowy-podglad` tworzy podgląd wyłącznie w pustym katalogu poza checkoutem. Nie usuwa istniejących danych. Podgląd sprawdza tę samą konfigurację wykluczeń co Pages, lokalne odnośniki i fragmenty, sitemap, listę offline oraz brak nieuzgodnionych skryptów reklamowych. Testy HTTP podglądu potwierdzają niedostępność archiwum i wycofanych plików. Testy archiwum źródłowego pozostają oddzielne: jego szyfrowane pliki nie zostały zmienione. Workflow „Check public site” zgłasza niespójne wygenerowane pliki lub granicę publikacji; nie jest decyzją Google ani audytem prawnym.

Po zmianie formatowania HTML najpierw uruchomić generator treści, a potem generator offline. Nie formatować ponownie zarządzanego regionu katalogu bez ponowienia generatorów. Zmiany treści w `templates/gry.html` trafiają do wygenerowanej biblioteki. Metadane gier pozostają w `assets/catalog.js`; nie powstał osobny fikcyjny katalog tylko dla robotów.

## Ograniczenie dostępu do źródeł i produkcji

24 października 2026 próby otwarcia oficjalnych stron pomocy Google, domeny `www.spinnerrealyt.pl` i adresu GitHub Pages zakończyły się błędem proxy środowiska `Tunnel connection failed: 403 Forbidden`. Próby zwykłego odczytu DNS nie powiodły się również dla znanej domeny `thesuper123.github.io` (`Temporary failure in name resolution`). To nie jest dowód, że strona zwraca Google błąd 403 lub że jej DNS jest błędny. Nie obchodzono proxy, nie wyłączano TLS i nie uznano bieżących zasad Google za przeczytane lub niezależnie potwierdzone.

30 października 2026 ponowiono odczyt zasad programu AdSense, wymagań CMP i `https://www.spinnerrealyt.pl/`. Wszystkie trzy próby nadal zakończyły się tym samym błędem proxy. Doprecyzowanie planu nie jest ponownym potwierdzeniem działania witryny produkcyjnej ani aktualności zasad Google.

Właściciel powinien sprawdzić bieżące wymagania i status w swoim koncie. Punkty odniesienia do samodzielnej aktualnej weryfikacji:

- [Zasady programu AdSense](https://support.google.com/adsense/answer/48182?hl=pl)
- [Kwalifikacja do AdSense](https://support.google.com/adsense/answer/9724?hl=pl)
- [Wymagania Google dotyczące CMP](https://support.google.com/adsense/answer/13554116?hl=pl)
- [Zasady Google dla wydawców](https://support.google.com/publisherpolicies/)

Podglądy interfejsu znajdują się w `docs/screenshots/public-site/`. Nie są publikowane jako części serwisu.
