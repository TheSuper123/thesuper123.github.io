# Gra 101 — Ostatnia warta

Autorski pojedynek bullet hell z mechanicznym Nadzorcą. Z prośby o walkę inspirowaną Sansem wykorzystano ogólne mechaniki: małą arenę, uniki, tury, zmianę przyciągania, skoki, opóźnione obrażenia i ataki zależne od ruchu. Postać, jej sylwetka, iskra gracza, kompozycja ekranu, dialogi, sekwencje i muzyka powstały dla tej gry. Nie importowano plików, sprite’ów, utworów, fontów, tekstów ani skryptów Undertale. Gra nie jest oficjalnym produktem tej marki; nowa nazwa i oprawa służą odrębnej tożsamości. Nie jest to opinia prawna ani gwarancja braku wszelkich roszczeń.

## Pełna walka

Gracz ma 64 energii, trzy naprawy po 22 punkty i iskierkę o małym hitboxie. Trafienie odbiera cztery punkty i dodaje trzy przegrzania, które schodzi po 2,5 punktu na sekundę podczas obrony. Ochrona po trafieniu trwa 0,35 s. Menu decyzji zatrzymuje ataki i przegrzanie.

Po obronie można dostroić impuls (6–14 obrażeń), zużyć naprawę albo przeskanować strażnika. Pomarańczowy wycinek okrągłego miernika wyznacza najlepszy moment. Brak potwierdzenia w 3,6 s wygasza impuls i przechodzi do następnej sekwencji. Rdzeń ma 144 punkty; zwycięstwo wymaga ukończenia wszystkich dwunastu sekwencji. Dodatkowe próby końcowe powtarzają trzy ostatnie układy, jeśli rdzeń nadal działa. Trzy skany ujawniają możliwość wyłączenia protokołu po dwunastej obronie, bez wyczerpywania rdzenia.

1. Kalibracja — przesuwające się bramy z przerwami.
2. Celownik — ostrzegane lasery na poprzednią pozycję.
3. Ciężar — skoki nad przeszkodami przy dolnej grawitacji.
4. Rezonans — wachlarze z przerwami.
5. Zmiana ściany — prawa, potem lewa grawitacja.
6. Ruch / bezruch — kreski oznaczają zatrzymanie, kropki ruch.
7. Nad podłogą — podesty nad polem pod napięciem.
8. Zacieśnienie — kurcząca się arena i bramy.
9. Przekątne — opóźnione ukośne lasery.
10. Odwrócenie — sufit i lewa ściana.
11. Dwa rozkazy — bramy razem z impulsami ruchu.
12. Rozszczelnienie — połączenie laserów, wachlarzy i przyciągania.

Trening zmniejsza bezpośrednie obrażenia do dwóch, przegrzanie do jednego, wydłuża ochronę, zwalnia ruchome przeszkody i pozwala zacząć od wybranej sekwencji. Nie zapisuje rekordu. Pełne Wyzwanie zapisuje wyłącznie najlepszy czas oraz liczbę trafień pod `spinner:prefs:bossfight:best:v1`, po zgodzie na preferencje; bez zgody wynik zostaje w pamięci strony. Nie powstaje ranking sieciowy.

## Sterowanie i integracja

Ruch działa na klawiaturze i kilku palcach równocześnie. W grawitacji skacze się Spacją albo kierunkiem przeciwnym do przyciągania. Przytrzymanie wydłuża skok. Shift / Precyzja daje wolniejszy ruch. Enter obsługuje start i impuls, 1–4 decyzje, a P pauzę. Utrata fokusu, ukrycie karty i dialog nadrzędnego odtwarzacza zatrzymują rozgrywkę oraz czyszczą wejścia. Wznowienie wymaga działania gracza.

Fizyka pracuje co 1/120 s. Okno ostrzeżenia, życie przeszkody, rzeczywisty ruch gracza, trafienia odcinkiem i narożniki są obliczane niezależnie od rysowania. Arena zachowuje współrzędne podczas obrotu ekranu, a boss i sterowanie zmieniają układ. Mniejszy hitbox niż grafika iskry ułatwia ocenę uników. Gra korzysta ze wspólnego interfejsu, motywów, szybkiego odtwarzacza, pomocy i pakietu offline. Licznik katalogu i pakiet obejmują 101 pozycji; PWA pobiera liczbę z metadanych zestawu.

Dźwięk jest wyłączony do świadomego włączenia. Efekty i własny syntetyczny motyw w pięciodzielnym rytmie powstają lokalnie przez Web Audio. Nie są pobierane nagrania ani próbki. Pauza zawiesza dźwięk; wszystkie komunikaty mają też postać wizualną. Preferencja ograniczenia animacji wyłącza dekoracyjny ruch przeciwnika.

## Weryfikacja

```sh
python3 tests/test_bossfight.py
python3 tests/test_pwa.py
python3 tests/test_salon.py
python3 tests/test_viewport.py
python3 tests/test_bossfight.py --screenshots
python3 scripts/build_offline_pack.py --check
```

Testy obejmują dwanaście sekwencji, oba zakończenia, kolizje i ostrzeżenia, cztery kierunki grawitacji, zmienną wysokość skoku, rzeczywiste wejścia wielodotykowe, opóźnienie klawiatury, ochronę i przegrzanie, naprawy, pauzę, wygaśnięcie impulsu, przegraną, restart, opcjonalny rekord, dźwięk oraz rozmiary 320×568, 390×844, 844×390 i 1440×900 w obu motywach. W testach pełnych przejść kontrolowana osłona oddziela test ścieżek zakończenia od testów obrażeń; nie jest trybem dostępnym w interfejsie. Test pakietu uruchamia wszystkie 101 pozycji bez internetu i rozpoczyna nową walkę offline. Rzeczywista instalacja na fizycznym iPhonie wymaga sprawdzenia na urządzeniu.

Podglądy: [start](screenshots/bossfight/intro-desktop.png), [arena](screenshots/bossfight/arena-desktop.png), [telefon](screenshots/bossfight/arena-mobile-dark.png), [decyzja](screenshots/bossfight/choices-mobile.png), [impuls w poziomie](screenshots/bossfight/timing-landscape.png).
