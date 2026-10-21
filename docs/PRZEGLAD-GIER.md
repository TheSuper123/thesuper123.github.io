# Przegląd rozgrywki — 21 października 2026

Sprawdzono i zmieniono wszystkie osiem gier publicznego katalogu, pięć silników w zaszyfrowanym archiwum oraz Przekaźnik i interaktywny quiz. Poradnik wędkarski, Sondaże i Soon nie są grami; również uporządkowano ich działanie.

| Gra | Naprawione problemy | Ulepszenia rozgrywki |
| --- | --- | --- |
| Snake | Reakcja dopiero po puszczeniu przycisku, rysowanie poprzedniej klatki, gubienie szybkich skrętów, niespójny zapis rekordu, kolizja z opuszczanym ogonem i koniec pełnej planszy. | Pointerdown, bufor dwóch skrętów, płynne rysowanie, trzy tempa i plansze, przechodzenie przez krawędzie, złoty owoc, WASD i gesty. |
| Saper | Rekurencyjne odkrywanie dużych obszarów, zdublowane flagowanie dotykiem, zegar i brak pełnej obsługi klawiatury. | Bezpieczny start wraz z sąsiedztwem, odkrywanie wokół oznaczonych liczb, pauza, rekordy czasu i statystyki. |
| Saper klasyczny | Niemożliwe liczby min prowadzące do zapętlenia, wydawanie podpowiedzi po końcu gry, łatwe nabijanie punktów i blokujące alerty. | Walidowana własna plansza, bezpieczny start, flaga długim dotknięciem, uczciwe podpowiedzi, zegar, rekordy i klawiatura. |
| Kółko i krzyżyk | Opóźnione ruchy komputera po restarcie i niedopracowana ocena ruchów. | Wybór X/O, wynik serii, rewanż, podpowiedź i zaznaczenie zwycięskiej linii. Trudna AI została sprawdzona dla wszystkich legalnych kontynuacji gracza. |
| Labirynt | Dawna plansza była zbiorem losowych ruchomych przeszkód, bez gwarancji przejścia; sterowanie i tempo były niedopracowane. | Rzeczywisty, spójny labirynt, trzy osiągalne klucze, ślad drogi, czas i kroki, dzienna trasa oraz powtórzenie układu. |
| Geometry Run | Różna fizyka przy różnym FPS, przypadkowe przeszkody po każdym restarcie, problemy po zmianie rozmiaru. | Stały krok fizyki, powtarzalna trasa, bufor skoku i krótka tolerancja skoku po zejściu z krawędzi, trzy etapy, trening z punktami kontrolnymi i znaczniki. |
| Snake Arena | Tempo zależne od renderowania, niebezpieczny start, niedopracowany kierunek ruchu i tabela. | Bezpieczny start, wolniejsi botowie, klawiatura i joystick, przyspieszenie kosztem długości, serie zbierania, cele rundy i tabela rzeczywistego stanu. |
| Mały lot | Różna fizyka przy różnym FPS, opóźniony podskok i niekontrolowane różnice wysokości kolejnych bramek. | Fizyka 120 Hz, trzy tempa, łagodniejsze przejścia, pióra z premią, osobne rekordy, nowa animacja ptaka i krajobraz. |
| Tetris — others | Niedopracowane wejście, obrót przy ścianie, brak kontroli powtarzania ruchów i pauzy. | Natychmiastowe wejście, worek siedmiu figur, cień lądowania, schowek, obrót przy ścianie, chwila na ustawienie po dotknięciu podłoża, poziomy i linie. |
| Flappy Bird — others | Fizyka zależna od FPS, możliwość wielu pętli i niespójne klucze rekordu. | Fizyka 120 Hz, cztery tempa, powtarzalna trasa, start pierwszym podskokiem, premia za środek bramki, pauza i rekordy poziomów. |
| Block Blast — others | Sztywne przesunięcie przeciągania o 70 px, brak punktów za ułożenie klocka oraz alert resetujący rundę. | Przeciąganie z przechwytywaniem wskaźnika, układanie kliknięciem i klawiaturą, obrót, jednoczesne czyszczenie rzędów/kolumn, serie, cofnięcie i sprawdzanie dostępnych ruchów. |
| DOOM HTML — others | Ślepe przejścia, odnośniki przeładowujące tę samą scenę, brak rzeczywistego zakończenia. | Spójna wyprawa z czterema posterunkami, kluczem i ewakuacją, mapa, dziennik, blokowane drzwi, klawiatura i cofanie z zachowaniem stanu. |
| Geometry Dash Lite / Unity — others | Martwe sterowanie dotykowe, brak pauzy silnika i czytelnej obsługi błędów ładowania. | Prawdziwa pauza/wznowienie pętli Unity, poprawne zdarzenia skoku i ich zwalnianie, procent ładowania, ponowienie po błędzie i pełny ekran. |
| Przekaźnik | Dochód zależny od FPS, automatyczne wydawanie punktów przy przejściu obok węzła, odtwarzanie DOM co klatkę i odtwarzanie usuniętego zapisu. | Sieć na canvasie, ręczne zakupy, nawigacja i wybór celu, impulsy energii, cel końcowy, pauza oraz walidowany zapis. |
| Quiz opinii | Podwójne liczenie przy szybkich odpowiedziach, brak wygodnego cofania i niewiarygodne dopasowanie do partii. | 12 lub 123 pytania, zmiana odpowiedzi, postęp, podsumowanie własnych wyborów, restart, eksport UTF-8 i druk/PDF przeglądarki. Odpowiedzi pozostają w pamięci strony. |

## Wspólny gracz

Zmieniono integrację ramek: otwarcie konta lub ustawień prywatności zatrzymuje aktywną grę, a zamknięcie okna nie uruchamia jej samoczynnie. Usuwanie zapisanych preferencji dociera do już otwartych gier. Ramka dopasowuje wysokość do 1600 px, aby zmieścić dłuższe panele wyników i sterowania. Pełny ekran nadpisuje wysokość ramki, a błąd wczytania ma działający przycisk ponowienia. Motywy pozostają wspólne dla strony i rozgrywki.

## Pozostałe strony

- Poradnik wędkarski: wyszukiwanie, spis rozdziałów i checklista zamiast wymagania nicku. Wcześniejsze regionalne przepisy są opisane jako wymagające aktualnej weryfikacji.
- Sondaże: usunięto automatyczne zewnętrzne osadzenie i twierdzenie o aktualnych danych; zachowano dobrowolny odnośnik do archiwalnego wykresu.
- Soon: jasno opisuje brak gry pod tym adresem i prowadzi do działającego katalogu.

## Weryfikacja i ograniczenia

Testy obejmują rzeczywiste wejście przed puszczeniem przycisku, serię szybkich skrętów, pełne rundy i zakończenia, restart, pauzę, zmianę motywu, dotyk, klawiaturę, różne częstotliwości renderowania oraz wybór trwałego zapisu. Testy prywatnych gier czytają odtworzone pliki wyłącznie spoza publikowanego repozytorium. Nie zawierają hasła ani kopii prywatnych materiałów.

W środowisku Chromium przeszło **76 testów**: 12 dotychczasowych smoke oraz 64 testy funkcjonalne i kryptograficzne. Po ponownym zaszyfrowaniu sprawdzono dodatkowo sześć pozycji rzeczywistego archiwum przez service workera: rozgrywkę Tetrisa i Birda, układanie/cofanie klocków, zwycięską misję DOOM-a, wyszukiwanie w poradniku oraz rzeczywiste ładowanie i pauzę Unity. Wszystkie działały w obu motywach na układzie mobilnym, a blokada ponownie odcinała dostęp.

Podglądy rozgrywki: [Snake](screenshots/games/snake.png), [Labirynt](screenshots/games/maze.png), [Geometry Run](screenshots/games/geometry.png), [Arena](screenshots/games/arena.png), [telefon](screenshots/game-mobile.png). Nie publikowano zrzutów chronionych materiałów z archiwum.

```sh
python3 tests/smoke.py
SPINNER_ARCHIVE_SOURCE=/ścieżka/poza/repozytorium python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Odtworzenie i ponowne zaszyfrowanie archiwum opisano w [others/README.md](../others/README.md). Zachowano hasło i parametry ochrony; jawne materiały nie są publikowane.

Wewnętrzne trasy i grafiki skompilowanego Unity pozostają archiwalne — ich przebudowa wymaga projektu źródłowego. DOOM pozostaje grą ze scenami HTML, nie silnikiem FPS. Przegląd i testy potwierdzają opisane zachowanie, nie gwarantują braku każdego możliwego błędu na każdym urządzeniu.
