# Więcej życia w salonie

Katalog nadal ma 100 pozycji. Dodano sposoby ich odkrywania i uruchamiania, bez nowych usług zewnętrznych, reklam czy analityki.

## Wybór według nastroju

Sekcja **„Na co masz dziś ochotę?”** zawiera cztery ręcznie dobrane zestawy: **Bez pośpiechu**, **Pokombinuję**, **Trochę refleksu** i **We dwoje**. Każdy ma osiem gier, pokazuje cztery naraz i pozwala wybrać **Inny zestaw**. To stałe propozycje redakcyjne, bez profilowania użytkownika.

Wybranie gry z zestawu dla dwóch osób uruchamia tryb lokalny, jeśli gra ma wybór przeciwnika. Artyleria i Rzutki już działają dla dwóch osób. Osobna strona zachowuje ten wybór przez parametr `rywal=local`.

## Losowanie gry

Przyciski **Zdaję się na los**, **Zakręć** i **Losuj z katalogu** otwierają ten sam panel. Pula odpowiada bieżącemu wyszukiwaniu i filtrowi, także ulubionym. Przy pustej puli przyciski są nieaktywne; przy jednej grze wybór jest natychmiastowy. W większej puli kolejny obrót nie powtarza poprzedniego wyniku. Losowanie pokazuje grę i jej opis, a dopiero **Gram w to** rozpoczyna rundę.

Animacja trwa około sekundy, nie odtwarza dźwięku i zatrzymuje się po zamknięciu. Przy preferencji ograniczenia ruchu wynik pojawia się od razu; zmiana tej preferencji w trakcie również kończy animację. Komunikat czytnika ekranu ogłasza gotowy wynik zamiast kolejnych zmieniających się nazw.

## Bilet: Trasa dnia

Każda data ma trzy publiczne pozycje: logiczną, zręcznościową oraz krótki quiz lub test umiejętności. Zestaw jest deterministyczny, wspólny dla odwiedzających i zmienia się o północy w strefie **Europe/Warsaw**, także bez przeładowania strony. Sekcja sprawdza datę co minutę oraz po powrocie do karty. Nie obejmuje kompasu politycznego.

Znacznik **Uruchomiono** pojawia się po udanym załadowaniu rzeczywistej gry. Samo kliknięcie, nieudane ładowanie i otwarcie panelu losowania nie dają postępu. Ponowne uruchomienie tej samej gry nie zwiększa licznika. Bilet pokazuje **0–3 uruchomionych**, nie wynik, wygraną, serię zwycięstw ani ranking.

Postęp korzysta z istniejącego `SpinnerStorage.preferences`. Bez opcjonalnej zgody pozostaje w pamięci strony; okno szybkiej rundy pozwala odwiedzić całą trasę bez opuszczania katalogu. Po zgodzie data i identyfikatory trzech odwiedzonych pozycji mogą być zachowane pod kluczem `spinner:prefs:salon:day:v1`. Starsze daty i nieprawidłowe wpisy są pomijane. Działa czyszczenie danych, cofnięcie zgody oraz aktualizacja między kartami. Politykę prywatności uzupełniono o ten zapis.

Zwykły odtwarzacz `gra.html` również odhacza udane uruchomienia z dzisiejszej trasy, więc powrót z osobnej strony działa po zgodzie na zapis. Odpowiedzi kompasu pozostają w pamięci jego ramki, również po wylosowaniu i potwierdzeniu tej pozycji; kompas nadal pomija historię gier i bilet.

## Szybka runda

Polecane gry, bilet i przycisk **Zagraj tutaj** w każdej karcie katalogu otwierają rzeczywistą grę nad stroną. Nie ma ramki gry ani symulacji w tle przed wyborem. Po zamknięciu ramka jest usuwana, jej działanie ustaje, a filtr, wyszukiwanie i pozycja katalogu pozostają. Fokus wraca do elementu, który otworzył rundę. Po uruchomieniu klawiatura trafia do gry, bez przełączania jej od razu w pauzę. Historia ostatnio granych aktualizuje się po udanym uruchomieniu i respektuje zgody.

Nagłówek ma motyw, restart, zasady, przejście do nowej rundy na osobnej stronie i zamknięcie. Plansza z prawdziwymi przyciskami mieści się pod nagłówkiem. Otwarcie zasad zatrzymuje grę; zamknięcie zasad jej samoczynnie nie wznawia. Escape najpierw zamyka otwarte opcje gry, a poza nimi wraca do katalogu. Zamknięcie kończy bieżącą rundę w ramce; nie jest zapisem stanu rozgrywki.

Błąd ładowania ma ponowienie i link do osobnej strony, bez zaliczania postępu. Spóźnione odpowiedzi i timery z zamkniętej ramki nie mogą zmienić nowego okna.

## Wygląd i pliki

Nowe elementy rozwijają dotychczasową papierową oprawę: obrotowy żeton przy automacie, wycinany bilet, krótkie listy propozycji i kontrastowy panel losowania. Zachowano lokalne fonty i własne SVG. Widok działa w jasnym i ciemnym motywie, na telefonie, tablecie i komputerze. Dodatki mają osobny arkusz, który nie jest ładowany wewnątrz stron gier.

- `assets/salon.js` — propozycje, losowanie, okno gry i interakcje.
- `assets/salon.css` — oprawa dodatków i ich układ.
- `assets/salon-day.js` — data zestawu, dobór pozycji i uczciwe odhaczanie uruchomień.
- `assets/catalog.js` — widoczna pula losowania, szybkie linki i aktualizacja historii.
- `assets/play.js` — dzienny postęp i start lokalnego trybu dwóch osób na osobnej stronie.

## Sprawdzenie

```sh
python3 tests/test_salon.py
python3 tests/smoke.py
python3 tests/test_player_integration.py
python3 tests/test_compass.py
python3 tests/test_new_games.py
```

Zestawy zawierają łącznie **59 scenariuszy**: 17 nowych i 42 regresyjne. Nowe testy obejmują wszystkie 100 rzeczywistych gier w oknie przy 320 × 568, 844 × 390 i 1440 × 900, geometrię plansz i przycisków, wybór według nastroju, lokalny tryb dwóch osób, filtrowane losowanie, anulowanie animacji, ograniczenie ruchu, błędy i ponowienie, prywatność, zgodę, północ i różne karty przeglądarki. Regresje sprawdzają katalog, konto z symulowanymi odpowiedziami Firebase, poprzedni odtwarzacz, kompas i wcześniejsze gry. Nie modyfikowano kont produkcyjnych ani zaszyfrowanego archiwum.

Podglądy: [nowy fragment strony](screenshots/salon/discovery-desktop.png), [ciemny motyw](screenshots/salon/discovery-dark.png), [telefon](screenshots/salon/discovery-mobile.png), [losowanie](screenshots/salon/roulette-mobile.png), [szybka runda](screenshots/salon/quick-game-mobile.png), [góra strony](screenshots/salon/home-desktop.png).
