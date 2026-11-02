# plBonds

Porównanie detalicznych obligacji skarbowych i symulacja wyniku po podatku oraz opłatach. Next.js, React, TypeScript; eksport statyczny do `out/`.

plBonds ma własną identyfikację: ciepłe jasne tło, zielony akcent, typografię Geist i autorską ilustrację. Nagłówek wskazuje, że jest to projekt niezależny od Ministerstwa Finansów i banków. Formularz nad tabelą przelicza wynik po podatku i opłatach. Karty zawierają odnośniki do warunków na obligacjeskarbowe.pl; kalkulator nie prowadzi sprzedaży. Na telefonie karty układają się pionowo, a szczegóły i rozliczenie można rozwinąć.

## Uruchomienie

Node.js 22.14+ i pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Wersja produkcyjna:

```sh
pnpm build
pnpm start
```

`pnpm start` serwuje `out/` pod http://127.0.0.1:3000 i wymaga Pythona 3. Na hostingu statycznym wystarczy opublikować zawartość `out/`; adapter Next.js do Cloudflare nie jest potrzebny. Dla Cloudflare Pages: komenda `pnpm build`, katalog wynikowy `out`, Node.js 22. Eksport zakłada hosting w katalogu głównym domeny. Hosting pod ścieżką `/plBonds/` wymaga dodatkowego ustawienia `basePath` przed budowaniem.

Analityka Vercel jest domyślnie wyłączona. Można ją włączyć zmienną `NEXT_PUBLIC_ENABLE_ANALYTICS=true` podczas budowania na hostingu obsługującym Vercel Web Analytics.

## Oferta

Dane zweryfikowano **1 listopada 2026 r.**, dla sprzedaży **1–30 listopada 2026 r.**, w [oficjalnym serwisie](https://www.obligacjeskarbowe.pl/). Dane i linki do listów emisyjnych są w `data/bonds.json`.

| Typ | Seria | Stawka początkowa rocznie | Kolejne okresy | Opłata za wcześniejszy wykup/szt. |
| --- | --- | ---: | --- | ---: |
| OTS | OTS0227 | 2,00% | stała przez 3 miesiące | brak, utrata odsetek |
| ROR | ROR1127 | 4,00% w 1. miesiącu | NBP + 0,00 p.p. | 0,50 zł |
| DOR | DOR1128 | 4,15% w 1. miesiącu | NBP + 0,15 p.p. | 0,70 zł |
| TOS | TOS1129 | 4,40% | stała przez 3 lata | 1,00 zł |
| COI | COI1130 | 4,75% w 1. roku | inflacja + 1,50 p.p. | 2,00 zł |
| ROS | ROS1132 | 5,00% w 1. roku | inflacja + 2,00 p.p. | 2,00 zł |
| EDO | EDO1136 | 5,35% w 1. roku | inflacja + 2,00 p.p. | 3,00 zł |
| ROD | ROD1138 | 5,60% w 1. roku | inflacja + 2,50 p.p. | 3,00 zł |

## Zasady symulacji

Silnik w `lib/calculator.ts` działa niezależnie od interfejsu:

- Zakup dotyczy pełnych obligacji po 100 zł. Reszta pieniędzy nie znika i nie jest oprocentowana.
- ROR/DOR: pierwszy miesiąc z oferty, następne ze stałego założenia NBP i marży; odsetki są wypłacane i opodatkowane co miesiąc.
- COI: pierwszy rok z oferty, następne z założenia inflacji i marży; kupony są wypłacane co roku, bez kapitalizacji.
- TOS/EDO/ROS/ROD: roczna kapitalizacja brutto, podatek przy wypłacie. Stawki inflacyjne uwzględniają marżę od drugiego roku.
- Ujemny wskaźnik inflacji jest zastępowany zerem do ustalenia oprocentowania. Wprowadzone wartości inflacji i NBP to założenia scenariusza, nie odczyty ani prognozy tych instytucji.
- Opłata pomniejsza odsetki przed podatkiem. W TOS/EDO/ROS/ROD nie przekracza wszystkich narosłych odsetek. W COI/ROR/DOR jest ograniczona do odsetek w pierwszym okresie, a w następnych może pomniejszać kapitał. Nie ma zwrotu podatku od wcześniejszych kuponów.
- OTS przy wcześniejszym wykupie zwraca sam nominał.
- Odsetki jednej obligacji są zaokrąglane do grosza. Podatek 19% zaokrąglamy do pełnego grosza w górę od łącznej wypłaty partii, zgodnie z [art. 63 § 1a Ordynacji podatkowej](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU19971370926/U/D19970926Lj.pdf). Grupowanie wypłat przez bank może powodować różnice groszowe.
- Za niepełny rok stosujemy rzeczywiste dni między rocznicami, także w roku przestępnym. Daty liczone są w UTC; rocznica na 29–31. dzień jest ograniczana do końca krótszego miesiąca.
- Horyzont to dzień rozliczenia. Kupon kończący się dokładnie w dniu wcześniejszego wykupu rozliczamy wraz z tym wykupem; wcześniejsze kupony są już wypłacone. Nie symulujemy przesunięć dni roboczych, świąt ani pięciodniowego oczekiwania na rozliczenie dyspozycji. Jest to porównanie miesięcznych scenariuszy, nie bankowa tabela rozliczenia konkretnej dyspozycji.
- Bez reinwestowania środki po wykupie i kupony pozostają w gotówce. Z reinwestowaniem kupujemy kolejną partię dopiero przy terminowym wykupie, wykorzystując również zebrane kupony i niewydaną gotówkę. Kupony nie są reinwestowane w trakcie życia obligacji.
- Przyszłe emisje mają w symulacji warunki bieżącej oferty i cenę 100 zł. Dyskonto zamiany 99,90 zł jest informacją o ofercie, ale nie jest zakładane dla przyszłych zakupów.
- ROS/ROD są domyślnie widoczne, z oznaczeniem „Tylko środki z 800+” przy nagłówku. Można je wykluczyć w ustawieniach założeń. Ich uwzględnienie zakłada posiadanie prawa do 800+ i wystarczającego limitu na pierwszy zakup. Nie zakładamy nowego limitu po wykupie, dlatego ich środki nie są automatycznie reinwestowane.
- Wynik sumuje kapitał, resztę gotówki i wypłacone kupony po podatku i opłatach. Nie uwzględnia IKE/IKZE ani zmiany siły nabywczej pieniądza.

### Przykłady kontrolne

| Zakup | Scenariusz | Wynik netto |
| --- | --- | ---: |
| 1 OTS po 100 zł | pełne 3 miesiące | 100,40 zł |
| 1 TOS po 100 zł | pełne 3 lata, 113,79 zł brutto z listu emisyjnego | 111,16 zł |
| 1 ROR po 100 zł | pełny rok, NBP 6% od 2. miesiąca | 104,66 zł |
| 1 COI po 100 zł | pełne 4 lata, inflacja 2,5% | 113,56 zł |
| 1 EDO po 100 zł | wykup po 24 miesiącach, inflacja 8%, opłata 3 zł | 110,44 zł |

## Weryfikacja

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm check:offer
```

Na macOS można użyć zainstalowanego Chrome: `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`.

Testy zawierają przykłady kontrolne, opłaty w kolejnych okresach, ujemną inflację, lata przestępne, zaokrąglenia i bilans środków dla 8 typów × 144 horyzontów × 2 ustawień reinwestowania. Testy przeglądarkowe sprawdzają formularz, aktualizowanie kwoty, przecinki dziesiętne, ustawienia scenariusza i ostrzeżenie o starej ofercie na ekranie komputera oraz telefonu.

## Aktualizacja danych

1. Sprawdź ofertę i list emisyjny każdej serii. Zmień `offer` oraz odpowiednie rekordy w `data/bonds.json`: serie, stawki, marże, opłaty, okresy, ceny, warunki i adresy źródeł.
2. Zaktualizuj przykłady i oczekiwania testów dla nowej oferty. Uruchom weryfikację.
3. Przebuduj stronę i opublikuj nowy `out/`.

`pnpm check:offer` sprawdza miesiąc oferty w strefie Europe/Warsaw, bieżące serie i początkowe stawki na stronie źródłowej. Kończy się błędem przy nieaktualnych danych, zmianie struktury strony lub problemie sieciowym. Marże, opłaty i warunki nadal wymagają sprawdzenia listów emisyjnych. Skrypt nie nadpisuje danych automatycznie.

GitHub Actions sprawdza kod przy pushu i PR. Osobny workflow kontroluje ofertę 1. i 2. dnia miesiąca oraz na żądanie. Harmonogram zacznie działać po dodaniu workflow do domyślnej gałęzi repozytorium. Niezależnie od tego strona wyświetla ostrzeżenie po zmianie miesiąca, także bez ponownego wdrożenia.
