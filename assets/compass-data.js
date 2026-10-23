/* Open editorial model. No requests, analytics, party assets or answer storage. */
(() => {
  "use strict";
  const axes = [
    {
      id: "economy",
      name: "Gospodarka",
      low: "Redystrybucja",
      high: "Wolny rynek",
      description: "Podatki, własność i organizacja usług.",
    },
    {
      id: "authority",
      name: "Władza i swobody",
      low: "Swobody obywatelskie",
      high: "Silne uprawnienia władzy",
      description: "Prywatność, kontrola władzy i granice ingerencji.",
    },
    {
      id: "culture",
      name: "Obyczaje",
      low: "Progresywizm",
      high: "Tradycjonalizm",
      description: "Prawo rodzinne, religia i różnorodność kulturowa.",
    },
    {
      id: "europe",
      name: "Integracja europejska",
      low: "Więcej kompetencji kraju",
      high: "Więcej wspólnych decyzji UE",
      description: "Podział kompetencji między Polską i Unią.",
    },
    {
      id: "climate",
      name: "Transformacja klimatyczna",
      low: "Ostrożniejsze tempo zmian",
      high: "Szybsza transformacja",
      description: "Tempo ograniczania emisji i akceptacja kosztów.",
    },
  ];
  const statements = [
    [
      0,
      -1,
      "Osoby o najwyższych dochodach powinny oddawać w podatku większą część zarobków niż osoby o niskich dochodach.",
    ],
    [
      1,
      1,
      "Służby powinny móc uzyskać dostęp do prywatnej korespondencji bez uprzedniej zgody sądu, jeśli powołują się na bezpieczeństwo.",
    ],
    [
      2,
      -1,
      "Małżeństwo cywilne powinno być dostępne dla par niezależnie od płci partnerów.",
    ],
    [
      3,
      1,
      "W większej liczbie spraw Polska powinna podejmować decyzje wspólnie z pozostałymi krajami UE, nawet jeśli nie zawsze uzyska preferowany wynik.",
    ],
    [
      4,
      1,
      "Warto szybciej odchodzić od węgla, nawet jeżeli oznacza to przejściowy wzrost kosztów energii.",
    ],
    [
      0,
      1,
      "Większość przedsiębiorstw powinna należeć do prywatnych właścicieli zamiast do państwa.",
    ],
    [
      1,
      -1,
      "Pokojowe demonstracje powinny być dozwolone także wtedy, gdy wyrażają poglądy niepopularne w społeczeństwie.",
    ],
    [
      2,
      1,
      "Zasady religijne powinny odgrywać istotną rolę w stanowieniu prawa państwowego.",
    ],
    [
      3,
      -1,
      "Więcej kompetencji przekazanych instytucjom UE powinno wrócić do władz krajowych.",
    ],
    [
      4,
      -1,
      "Utrzymanie niskich cen energii powinno mieć pierwszeństwo przed przyspieszaniem redukcji emisji.",
    ],
    [
      0,
      -1,
      "Powszechna ochrona zdrowia powinna być finansowana głównie z obowiązkowych danin, a nie z indywidualnych polis.",
    ],
    [
      1,
      1,
      "Władza powinna mieć możliwość zamykania mediów, które jej zdaniem zagrażają porządkowi publicznemu, bez wcześniejszego orzeczenia sądu.",
    ],
    [
      2,
      -1,
      "Decyzja o przerwaniu ciąży we wczesnym jej etapie powinna należeć do osoby w ciąży, bez konieczności podawania szczególnej przyczyny.",
    ],
    [3, 1, "Po spełnieniu warunków gospodarczych Polska powinna przyjąć euro."],
    [
      4,
      1,
      "Wyższe opłaty za emisje są uzasadnione, jeżeli skutecznie skłaniają przedsiębiorstwa do ograniczania zanieczyszczeń.",
    ],
    [
      0,
      1,
      "Mniejszy zakres regulacji rynku pracy jest wart zaakceptowania w zamian za większą swobodę zawierania umów.",
    ],
    [
      1,
      -1,
      "Niezależny sąd powinien móc unieważniać decyzje rządu naruszające prawa jednostki, nawet gdy rząd ma większość parlamentarną.",
    ],
    [
      2,
      1,
      "Szkoła publiczna powinna przede wszystkim promować tradycyjny model rodziny.",
    ],
    [
      3,
      -1,
      "Polska powinna zachować możliwie szeroką samodzielność polityczną, nawet kosztem mniejszego wpływu na wspólne decyzje UE.",
    ],
    [
      4,
      -1,
      "Kierowcy powinni zachować swobodny wjazd samochodami spalinowymi do centrów miast, nawet jeśli opóźnia to lokalne cele środowiskowe.",
    ],
    [
      0,
      -1,
      "Państwo powinno zwiększać zasób mieszkań na dostępny czynsz, nawet jeżeli wymaga to większych wydatków publicznych.",
    ],
    [
      1,
      1,
      "Publiczne systemy rozpoznawania twarzy są warte ograniczenia prywatności, jeśli mogą poprawić bezpieczeństwo.",
    ],
    [
      2,
      -1,
      "Mniejszości kulturowe powinny mieć możliwość podtrzymywania własnych zwyczajów, o ile przestrzegają wspólnego prawa.",
    ],
    [
      3,
      1,
      "Państwa UE powinny wspólnie finansować więcej projektów, nawet gdy Polska musi uczestniczyć w kosztach projektów w innych krajach.",
    ],
    [
      4,
      1,
      "Wsparcie odnawialnych źródeł energii z pieniędzy publicznych jest uzasadnione, nawet jeżeli zwiększa obciążenia podatkowe.",
    ],
    [
      0,
      1,
      "W usługach, w których można zapewnić realny wybór, konkurencja prywatnych dostawców jest zwykle lepsza od państwowego monopolu.",
    ],
    [
      1,
      -1,
      "Pełnoletni ludzie powinni mieć szeroką swobodę podejmowania ryzykownych decyzji dotyczących własnego życia, dopóki bezpośrednio nie krzywdzą innych.",
    ],
    [
      2,
      1,
      "Państwo powinno aktywnie chronić tradycyjną kulturę narodową przed zmianami obyczajowymi.",
    ],
    [
      3,
      -1,
      "Sprzeciw wobec dalszego przenoszenia kompetencji do UE jest ważniejszy od korzyści z głębszej integracji.",
    ],
    [
      4,
      -1,
      "Rozwój przemysłu i miejsc pracy powinien mieć pierwszeństwo przed przyjmowaniem bardziej ambitnych celów klimatycznych.",
    ],
  ];
  const parties = [
    {
      id: "pis",
      name: "Prawo i Sprawiedliwość",
      values: [-3, 4, 7, -4, -3],
      source: "https://pis.org.pl/",
      note: "Model łączy transfery społeczne z konserwatyzmem obyczajowym, naciskiem na silne państwo i ostrożnością wobec dalszej integracji.",
    },
    {
      id: "po",
      name: "Platforma Obywatelska",
      values: [2, -3, -2, 7, 3],
      source: "https://platforma.org/",
      note: "Model umiarkowanie rynkowy, proeuropejski i bardziej liberalny obyczajowo; PO jest partią, a KO szerszą koalicją.",
    },
    {
      id: "nowa-lewica",
      name: "Nowa Lewica",
      values: [-6, -5, -6, 7, 7],
      source: "https://lewica.org.pl/",
      note: "Model akcentuje usługi publiczne, prawa obywatelskie, liberalizację obyczajową i transformację energetyczną.",
    },
    {
      id: "razem",
      name: "Razem",
      values: [-8, -6, -7, 5, 8],
      source: "https://partiarazem.pl/",
      note: "Model mocno redystrybucyjny i progresywny, z naciskiem na prawa pracownicze, usługi publiczne i klimat.",
    },
    {
      id: "psl",
      name: "Polskie Stronnictwo Ludowe",
      values: [-1, 0, 4, 5, 1],
      source: "https://www.psl.pl/",
      note: "Model umiarkowanej gospodarki mieszanej, tradycji i poparcia członkostwa w UE; nie utożsamia PSL z całą dawną Trzecią Drogą.",
    },
    {
      id: "polska2050",
      name: "Polska 2050",
      values: [0, -3, -1, 7, 6],
      source: "https://polska2050.pl/",
      note: "Model centrowy gospodarczo, proeuropejski, z naciskiem na instytucje państwa i transformację energetyczną.",
    },
    {
      id: "nowa-nadzieja",
      name: "Nowa Nadzieja",
      values: [9, -2, 7, -7, -7],
      source: "https://wolnosc.pl/",
      note: "Model radykalnie rynkowy, konserwatywny obyczajowo i sceptyczny wobec dalszej integracji; nie reprezentuje wszystkich środowisk Konfederacji.",
    },
    {
      id: "ruch-narodowy",
      name: "Ruch Narodowy",
      values: [4, 6, 9, -9, -8],
      source: "https://ruchnarodowy.net/",
      note: "Model narodowo-konserwatywny: większy nacisk na suwerenność i porządek, mniejszy na szybkie zmiany klimatyczne.",
    },
  ];
  const ideologies = [
    {
      name: "Socjalizm demokratyczny",
      values: [-8, -6, -6, 3, 7],
      note: "Silna redystrybucja i usługi publiczne, prawa obywatelskie oraz demokratyczne instytucje.",
    },
    {
      name: "Socjaldemokracja",
      values: [-5, -4, -4, 6, 6],
      note: "Gospodarka rynkowa z rozbudowaną polityką społeczną i ochroną praw jednostki.",
    },
    {
      name: "Liberalizm społeczny",
      values: [1, -6, -6, 6, 5],
      note: "Prawa jednostki i pluralizm, połączone z rynkiem oraz podstawowymi usługami publicznymi.",
    },
    {
      name: "Liberalizm klasyczny",
      values: [8, -7, -2, 2, 0],
      note: "Wolność gospodarcza i obywatelska, ograniczony zakres ingerencji państwa.",
    },
    {
      name: "Konserwatyzm liberalny",
      values: [7, -1, 6, -2, -3],
      note: "Rynkowa gospodarka wraz z przywiązaniem do tradycji i stopniowych zmian obyczajowych.",
    },
    {
      name: "Konserwatyzm socjalny",
      values: [-4, 4, 7, -3, -2],
      note: "Tradycyjne wartości i większa rola państwa, również w świadczeniach społecznych.",
    },
    {
      name: "Chrześcijańska demokracja",
      values: [-1, 0, 4, 5, 1],
      note: "Społeczna gospodarka rynkowa, zasada pomocniczości i przywiązanie do tradycji.",
    },
    {
      name: "Konserwatyzm narodowy",
      values: [2, 6, 9, -8, -5],
      note: "Silny nacisk na tożsamość narodową, suwerenność, tradycję i porządek publiczny.",
    },
    {
      name: "Zielona polityka progresywna",
      values: [-4, -6, -6, 6, 9],
      note: "Szybka transformacja klimatyczna, prawa obywatelskie i ograniczanie nierówności.",
    },
  ];
  window.SpinnerCompassData = {
    version: "1.0",
    reference:
      "Autorski model orientacyjny z punktem odniesienia w kampanii 2023. Nie jest aktualnym zestawieniem programów ani deklaracją samych partii. Zmiany po 2023 r. nie zostały zweryfikowane.",
    axes,
    questions: statements.map(([axis, direction, text], i) => ({
      id: "q" + (i + 1),
      axis,
      direction,
      text,
    })),
    parties,
    ideologies,
  };
})();
