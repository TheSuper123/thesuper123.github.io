# Przygotowanie do Google Ads / AdSense — 24 października 2026

Nie potwierdzono pełnej zgodności ani zatwierdzenia przez Google. Wykonano przegląd kodu, poprawki publicznej wersji i testy lokalne. Strona nadal nie wyświetla reklam ani analityki. Nie dodawano numeru wydawcy, fikcyjnego `ads.txt`, kodu reklam ani komunikatu udającego certyfikowaną CMP.

Google Ads służy promowaniu strony, a AdSense wyświetlaniu reklam na stronie. Wymagania i czynności na koncie różnią się. Sama liczba gier, panel cookies, regulamin lub sitemap nie zapewniają akceptacji; Google ocenia m.in. treść, faktyczne działanie miejsca docelowego, sposób pozyskiwania ruchu i konto.

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

## Jeżeli chodzi o promowanie strony w Google Ads

Przed kampanią sprawdzić końcowy adres, domenę wyświetlaną, działanie przez HTTPS i dostępność w docelowym kraju na rzeczywistych urządzeniach. Reklama ma opisywać działającą funkcję, a nie wycofane archiwum, prototyp lub zapowiedzianą funkcję. Sprawdzić w koncie weryfikację reklamodawcy, ograniczenia kraju i tematyki oraz dokładny powód ewentualnego odrzucenia.

Brak śledzenia na stronie nie uniemożliwia reklamowania samego serwisu. Jeśli mają zostać dodane tagi Google, konwersje lub remarketing, potrzebna jest osobna konfiguracja wymaganych zgód i sygnałów Consent Mode w regionach objętych odpowiednimi zasadami. Wymogu certyfikowanej CMP dla produktów wydawcy nie należy automatycznie utożsamiać z wymaganiami każdej strony reklamowanej w Google Ads. Kampanie dotyczące kompasu i treści politycznych wymagają oddzielnego sprawdzenia aktualnych ograniczeń tematycznych, w tym dla UE.

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

Właściciel powinien sprawdzić bieżące wymagania i status w swoim koncie. Punkty odniesienia do samodzielnej aktualnej weryfikacji:

- [Zasady programu AdSense](https://support.google.com/adsense/answer/48182?hl=pl)
- [Kwalifikacja do AdSense](https://support.google.com/adsense/answer/9724?hl=pl)
- [Wymagania Google dotyczące CMP](https://support.google.com/adsense/answer/13554116?hl=pl)
- [Zasady Google dla wydawców](https://support.google.com/publisherpolicies/)
- [Wymagania dotyczące miejsca docelowego w Google Ads](https://support.google.com/adspolicy/answer/6368661?hl=pl)
- [Zasady Google Ads](https://support.google.com/adspolicy/)

Podglądy interfejsu znajdują się w `docs/screenshots/public-site/`. Nie są publikowane jako części serwisu.
