import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST is toegestaan" });
  }

  try {
    const { pdfText } = req.body || {};
    if (!pdfText || typeof pdfText !== "string") {
      return res.status(400).json({ error: "Geen PDF-tekst ontvangen" });
    }

    const rapportTekst = pdfText.substring(0, 12000);

    const prompt = `Je bent een senior ESG/ESRS-bankadviseur bij een institutionele vastgoedfinancier.

Je ontvangt een verduurzamingsrapport van een vastgoedeigenaar. Dit rapport is opgesteld door een adviseur 
en bevat energietechnische gegevens, maatregelen en financiële kentallen.

JE TAAK: Maak een COMPLEET ANDER, AANVULLEND ESG-bankdossier. Dit is GEEN samenvatting of herhaling 
van het verduurzamingsrapport. Het ESG-dossier heeft een ander doel, ander publiek en andere inhoud:

VERDUURZAMINGSRAPPORT (input) = technisch advies voor eigenaar → maatregelen, kosten, terugverdientijd
ESG-BANKDOSSIER (output) = financieel/regelgevend dossier voor bank/investeerder → ESRS, SFDR, Pillar 3, 
taxonomie-compliance, ESG-risicoprofiel, bankfinancierbaarheid, kredietbeoordeling

═══════════════════════════════════════════════════════════
WAT HET ESG-DOSSIER TOEVOEGT (niet in het verduurzamingsrapport)
═══════════════════════════════════════════════════════════

1. ESRS-RAPPORTAGE (European Sustainability Reporting Standards)
   - Exacte ESRS E1 velden: scope 1, 2, 3 emissies in tCO₂e/jr met berekeningswijze
   - ESRS E1-5: energieverbruik en -intensiteit (kWh/m²/jr)
   - ESRS E1-4: klimaatdoelen en transitieplan
   - ESRS S1: sociale impact (bewoners/gebruikers, werknemers)
   - ESRS G1: governance en bestuursstructuur eigenaar
   - Per veld: verplicht per (2025/2026), status (gevuld/indicatief/ontbreekt), regelgeving (SFDR/CSRD/Pillar 3)

2. SFDR-CLASSIFICATIE (Sustainable Finance Disclosure Regulation)
   - Is dit vastgoed geschikt als Artikel 6, 8 of 9 fonds-asset?
   - Principal Adverse Impacts (PAI) indicatoren die van toepassing zijn
   - Do No Significant Harm (DNSH) toets per milieudoelstelling

3. EU TAXONOMIE-COMPLIANCE
   - Voldoet het pand aan de EU Taxonomie voor duurzame activiteiten?
   - Substantial Contribution criteria voor klimaatmitigatie
   - DNSH-toets: klimaatadaptatie, water, circulaire economie, biodiversiteit, vervuiling
   - Minimale sociale waarborgen

4. CREDION ESG-SCORE (bankscore voor vastgoedfinanciering)
   - Huidige score A-D met motivering vanuit bankperspectief
   - Score na uitvoering maatregelen
   - Impact op financieringsvoorwaarden (rentemarge, LTV, zekerheden)

5. KLIMAATRISICO-ANALYSE (voor bank en investeerder)
   - Fysieke risico's: overstromingsrisico, hittestress, droogte (op basis van locatie)
   - Transitierisico's: stranded asset risico, regelgevingsrisico, carbon pricing
   - TCFD-alignment (Task Force on Climate-related Financial Disclosures)

6. SDG-BIJDRAGE met kwantificering
   - Welke VN Sustainable Development Goals worden bereikt
   - Kwantitatief bewijs per SDG (niet alleen noemen, maar meten)
   - Impact op doelstellingen 2030

7. BANKFINANCIERINGSADVIES (aanvullend op technisch advies)
   - ESG-linked financieringsstructuren (groene lening, sustainabilty-linked loan)
   - BMKB-Groen toetsing
   - Impact van ESG-score op rentemarge (spread)
   - Covenant suggesties (KPI's gekoppeld aan financiering)

8. COMPLIANCE-GAPS voor bank-onderbouwing
   - Welke data ontbreekt voor een volledig bankdossier
   - Prioriteit per gap (kritiek voor financiering / aanbevolen / wenselijk)
   - Actieplan per gap

═══════════════════════════════════════════════════════════
BEREKENINGSREGELS
═══════════════════════════════════════════════════════════
• Scope 1 CO₂ aardgas: m³ × 1,785 kg CO₂/m³ ÷ 1000 = tCO₂e/jr
  (indicatief gasverbruik: € gaskosten ÷ 1,10 €/m³ = m³/jr)
• Scope 2 CO₂ locatie-gebaseerd: kWh_netto × 0,420 kg CO₂/kWh ÷ 1000 = tCO₂e/jr
  (netto = totaal elektra - zelfopwekking zonnepanelen)
• Scope 2 CO₂ markt-gebaseerd: 0 bij gecertificeerde groene stroom, anders = locatie
• Scope 3: voor gebouwen vnl. embodied carbon materialen (0 als geen data)
• Energielabel → EPA-index: G=400, F=340, E=280, D=220, C=160, B=100, A=50, A+=25
• CO₂-intensiteit: totaal_tCO₂e ÷ VVO_m² = kg CO₂/m²/jr
• Energieintensiteit: kWh_totaal ÷ VVO_m² = kWh/m²/jr

Bereken alle scope 1+2 emissies op basis van de energiedata in het rapport.
Indien gasverbruik niet exact bekend: schat op basis van energiekosten en label.
Geef altijd de berekeningswijze aan in het toelichting-veld.

═══════════════════════════════════════════════════════════
TOON EN STIJL
═══════════════════════════════════════════════════════════
• Schrijf vanuit bankperspectief, niet vanuit eigenaarsperspectief
• Gebruik professionele, institutionele taal
• Wees specifiek: exact getallen, niet "nader te bepalen" tenzij echt onbekend
• Voeg interpretatie toe: wat betekent dit voor de financierbaarheid?
• Samenvatting: schrijf dit alsof je het aan een kredietcommissie presenteert

Retourneer UITSLUITEND valide JSON — geen markdown, geen uitleg buiten de JSON.

{
  "object_naam": "officiële naam pand",
  "object_adres": "volledig adres",
  "bron_tool": "naam verduurzamingstool/adviseur",
  "datum_rapport": "datum",
  "huidig_label": "huidige energielabelklasse",
  "streef_label": "streef label na maatregelen",
  "functie": "gebruiksfunctie",
  "bouwjaar": "bouwjaar",
  "oppervlakte": "m² VVO",
  "samenvatting": "3-4 zinnen vanuit bankperspectief: kredietrelevantie van het verduurzamingstraject, ESG-risicoprofiel, taxonomie-geschiktheid en impact op financieringsvoorwaarden",

  "huidige_energiekosten": "€ X.XXX per jaar",
  "besparing_jaar": "€ X.XXX per jaar",
  "totaal_investering": "€ XX.XXX bruto",
  "netto_investering": "€ XX.XXX na subsidies en fiscaal",
  "gemiddelde_tvt": "X,X jaar",
  "co2_reductie_pct": "XX%",
  "co2_reductie_abs": "X,X tCO₂e/jr",

  "gasverbruik_m3": "geschat op basis van energiekosten en label",
  "elektra_kwh": "kWh/jr",
  "zelfopwekking_kwh": "kWh/jr (zonnepanelen)",
  "netto_netafname_kwh": "kWh/jr",
  "hernieuwbaar_pct": "% nu",
  "hernieuwbaar_pct_na": "% na maatregelen",

  "scope1_co2": "X,X tCO₂e/jr (berekening: X m³ gas × 1,785 ÷ 1000)",
  "scope2_co2_locatie": "X,X tCO₂e/jr (berekening: X kWh × 0,420 ÷ 1000)",
  "scope2_co2_markt": "X,X tCO₂e/jr",
  "scope1_co2_na": "X,X tCO₂e/jr na maatregelen",
  "scope2_co2_na": "X,X tCO₂e/jr na maatregelen",
  "totaal_co2_huidig": "X,X tCO₂e/jr",
  "totaal_co2_na": "X,X tCO₂e/jr",

  "credion_score_nu": "B — toelichting vanuit bankperspectief: financieringsimpact, LTV-invloed, rentemarge",
  "credion_score_na": "A — toelichting: verwachte verbetering financieringsvoorwaarden, groene lening kwalificatie",

  "sfdr_classificatie": {
    "artikel": "6 | 8 | 9",
    "toelichting": "Motivering waarom dit object als artikel X asset kwalificeert",
    "pai_indicatoren": ["PAI 1: GHG-emissies", "PAI 7: Energieverbruik niet-hernieuwbaar", "PAI 11: Hernieuwbare energie"],
    "dnsh_toets": "Samenvatting DNSH-toets: voldoet/voldoet niet aan de zes milieudoelstellingen"
  },

  "taxonomie_compliance": {
    "activiteit": "7.7 Renovatie van bestaande gebouwen",
    "substantial_contribution": "Voldoet/voldoet niet — motivering op basis van energielabel en reductie",
    "dnsh_klimaatadaptatie": "Toets resultaat",
    "dnsh_water": "Toets resultaat",
    "dnsh_circulair": "Toets resultaat",
    "dnsh_biodiversiteit": "Toets resultaat",
    "dnsh_vervuiling": "Toets resultaat",
    "minimale_sociale_waarborgen": "Toets resultaat",
    "taxonomie_eligible": true,
    "taxonomie_aligned": false,
    "toelichting": "Uitleg over wat nog nodig is voor volledige taxonomie-alignment"
  },

  "tcfd_analyse": {
    "fysieke_risicos": [
      {
        "risico": "Hittestress",
        "ernst": "hoog | middel | laag",
        "tijdshorizon": "korte | middellange | lange termijn",
        "financiele_impact": "geschatte impact op vastgoedwaarde of exploitatie",
        "toelichting": "specifiek voor dit pand en locatie"
      }
    ],
    "transitierisicos": [
      {
        "risico": "Stranded asset risico bij label < C na 2030",
        "ernst": "hoog | middel | laag",
        "tijdshorizon": "middellange termijn (2030)",
        "financiele_impact": "geschatte waardevermindering bij inactiviteit",
        "toelichting": "specifiek voor dit pand"
      }
    ],
    "kansen": [
      {
        "kans": "Green premium op huurwaarde na verduurzaming",
        "potentie": "geschatte huurpremie of waardestijging",
        "toelichting": "onderbouwing"
      }
    ]
  },

  "compl_scope12": 85,
  "compl_energie": 80,
  "compl_sdg": 70,
  "compl_scope3": 25,
  "compl_governance": 20,
  "compl_maatregelen": 90,

  "maatregelen": [
    {
      "naam": "naam maatregel uit verduurzamingsrapport",
      "categorie": "isolatie | installatie | opwekking | gedrag | monitoring",
      "fase": "Fase 1 | 2 | 3",
      "prioriteit": "hoog | middel | laag",
      "besparing_jr": "€ X.XXX",
      "investering": "€ X.XXX",
      "tvt": "X jaar",
      "co2_reductie": "X,X tCO₂e/jr — berekend op basis van [methode]",
      "scope": "Scope 1 | Scope 2 | Scope 1+2",
      "subsidies": "relevante subsidies",
      "omschrijving": "ESG-relevantie van deze maatregel voor bankdossier: wat draagt het bij aan ESRS-compliance, taxonomie-alignment en kredietprofiel",
      "esrs_koppeling": "Welk ESRS-veld wordt door deze maatregel verbeterd",
      "aandachtspunt": null
    }
  ],

  "esrs_velden": [
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Scope 1 broeikasgasemissies (direct)",
      "code": "E1-6 · par. 44a",
      "waarde": "X,X tCO₂e/jr",
      "waarde_na": "X,X tCO₂e/jr",
      "eenheid": "tCO₂e/jr",
      "bron": "Berekend: X m³ gas × 1,785 kg CO₂/m³ ÷ 1000",
      "regelgeving": ["SFDR", "CSRD", "Pillar 3"],
      "verplicht_per": "2025",
      "status": "gevuld",
      "toelichting": "Bankinterpretatie: dit veld is verplicht voor Pillar 3 EBA-rapportage en SFDR PAI-1"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Scope 2 broeikasgasemissies (locatie-gebaseerd)",
      "code": "E1-6 · par. 44b",
      "waarde": "X,X tCO₂e/jr",
      "waarde_na": "X,X tCO₂e/jr",
      "eenheid": "tCO₂e/jr",
      "bron": "Berekend: X kWh netto netafname × 0,420 kg CO₂/kWh ÷ 1000",
      "regelgeving": ["SFDR", "CSRD", "Pillar 3"],
      "verplicht_per": "2025",
      "status": "gevuld",
      "toelichting": "Locatie-gebaseerde methode verplicht voor SFDR PAI; markt-gebaseerd aanvullend"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Primair energieverbruik en -intensiteit",
      "code": "E1-5 · par. 37a",
      "waarde": "X.XXX kWh/jr | X kWh/m²/jr",
      "waarde_na": "X.XXX kWh/jr | X kWh/m²/jr",
      "eenheid": "kWh/jr",
      "bron": "Energielabel + aannames op basis van gebruiksoppervlak",
      "regelgeving": ["SFDR", "Pillar 3", "Benchmark"],
      "verplicht_per": "2025",
      "status": "indicatief",
      "toelichting": "Energieintensiteit (kWh/m²/jr) is kernmetric voor EBA Pillar 3 vastgoedrapportage"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Aandeel hernieuwbare energie",
      "code": "E1-5 · par. 37b",
      "waarde": "X%",
      "waarde_na": "X%",
      "eenheid": "%",
      "bron": "Zonnepanelen opwekking t.o.v. totaal verbruik",
      "regelgeving": ["SFDR", "Taxonomie"],
      "verplicht_per": "2025",
      "status": "indicatief",
      "toelichting": "Relevant voor Taxonomie Substantial Contribution criterium klimaatmitigatie"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Energielabel en EPA-waarde",
      "code": "E1-5 · par. 40",
      "waarde": "Label C | EPA-index 160",
      "waarde_na": "Label A+ | EPA-index 25",
      "eenheid": "label",
      "bron": "EPC-rapport / energielabel registratie RVO",
      "regelgeving": ["SFDR", "Pillar 3", "CSRD"],
      "verplicht_per": "2024",
      "status": "gevuld",
      "toelichting": "Energielabel is primaire indicator voor EBA Pillar 3 en SFDR PAI-7; stijging van C naar A+ is significante verbetering voor bankrapportage"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "CO₂-intensiteit vastgoed (kg CO₂/m²/jr)",
      "code": "E1-6 · par. 51",
      "waarde": "X kg CO₂/m²/jr",
      "waarde_na": "X kg CO₂/m²/jr",
      "eenheid": "kg CO₂/m²/jr",
      "bron": "Berekend: totaal tCO₂e ÷ VVO m²",
      "regelgeving": ["Pillar 3", "Benchmark"],
      "verplicht_per": "2025",
      "status": "gevuld",
      "toelichting": "Kernmetric voor benchmarking vastgoedportefeuille; EU Benchmark Regulation vereist CO₂-intensiteit per m²"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E1",
      "veld": "Klimaatdoelen en transitieplan",
      "code": "E1-4 · par. 30",
      "waarde": "—",
      "waarde_na": "Label A+ haalbaar in 2027",
      "eenheid": "kwalitatief",
      "bron": "Verduurzamingsrapport MB Adviesgroep",
      "regelgeving": ["CSRD"],
      "verplicht_per": "2026",
      "status": "indicatief",
      "toelichting": "Formeel transitieplan ontbreekt; verduurzamingsrapport vormt basis maar voldoet nog niet aan ESRS E1-4 vereisten"
    },
    {
      "categorie": "E",
      "standaard": "ESRS E2",
      "veld": "Scope 3 broeikasgasemissies (keten)",
      "code": "E1-6 · par. 44c",
      "waarde": "Niet bepaald",
      "waarde_na": "Niet bepaald",
      "eenheid": "tCO₂e/jr",
      "bron": "Niet beschikbaar in verduurzamingsrapport",
      "regelgeving": ["CSRD"],
      "verplicht_per": "2026",
      "status": "ontbreekt",
      "toelichting": "Scope 3 (embodied carbon bouwmaterialen, leveranciersketen) ontbreekt; verplicht onder CSRD 2026; laag prioriteit voor dit type gebouw"
    },
    {
      "categorie": "S",
      "standaard": "ESRS S1",
      "veld": "Wooncomfort en gezondheid gebruikers",
      "code": "S1-1 · par. 77",
      "waarde": "—",
      "waarde_na": "Verbeterd door isolatie, HR-glas en warmtepomp",
      "eenheid": "kwalitatief",
      "bron": "Verwacht effect op basis van maatregelen",
      "regelgeving": ["CSRD"],
      "verplicht_per": "2026",
      "status": "ontbreekt",
      "toelichting": "Sociaal veld: gezondheid, comfort en betaalbaarheid voor recreatiegasten en bedrijfswoning. Kwalitatief aan te vullen na uitvoering"
    },
    {
      "categorie": "G",
      "standaard": "ESRS G1",
      "veld": "Duurzaamheidsbeleid eigenaar",
      "code": "G1-1 · par. 19",
      "waarde": "—",
      "waarde_na": "—",
      "eenheid": "ja/nee",
      "bron": "Niet aanwezig in rapport",
      "regelgeving": ["CSRD"],
      "verplicht_per": "2026",
      "status": "ontbreekt",
      "toelichting": "Kritiek voor bankfinanciering: eigenaar dient formeel duurzaamheidsbeleid te documenteren als onderdeel van ESG-covenant"
    },
    {
      "categorie": "G",
      "standaard": "ESRS G1",
      "veld": "Bestuursstructuur en eigendomsinformatie",
      "code": "G1-2 · par. 22",
      "waarde": "—",
      "waarde_na": "—",
      "eenheid": "kwalitatief",
      "bron": "Niet aanwezig in rapport",
      "regelgeving": ["CSRD", "Pillar 3"],
      "verplicht_per": "2026",
      "status": "ontbreekt",
      "toelichting": "Verplicht voor CSRD en Pillar 3; bank heeft eigendomsstructuur nodig voor KYC en ESG-dossier"
    }
  ],

  "sdg_onderbouwing": [
    {
      "sdg_nr": "SDG 7",
      "sdg_naam": "Betaalbare en duurzame energie",
      "sdg_icoon_kleur": "#FCC30B",
      "relevantie": "hoog",
      "maatregel": "Zonnepanelen uitbreiden (15 panelen, ~3.300 kWh/jr)",
      "bewijs": "Zelfopwekking stijgt van 2.200 naar ~3.300 kWh/jr (+50%); hernieuwbaar aandeel neemt toe",
      "doelstelling_2030": "NL-doelstelling: 70% hernieuwbare energieopwekking in 2030; dit object draagt bij via uitbreiding zelfopwekking",
      "status": "ok",
      "toelichting": "Uitbreiding zonnepanelen verhoogt het aandeel hernieuwbare energie direct meetbaar. Bijdrage aan SDG 7.2 (hernieuwbaar aandeel verdubbelen)."
    },
    {
      "sdg_nr": "SDG 11",
      "sdg_naam": "Duurzame steden en gemeenschappen",
      "sdg_icoon_kleur": "#FD9D24",
      "relevantie": "hoog",
      "maatregel": "HR++ glas, geïsoleerde buitendeuren, dakisolatie (schilverbetering totaal)",
      "bewijs": "Label C → A+; energielabel-verbetering van gebouw uit 1742 draagt bij aan kwalitatieve woningvoorraad",
      "doelstelling_2030": "NL-doelstelling: alle huurwoningen minimaal label D in 2028, label C in 2030; recreatievastgoed valt buiten verplichting maar draagt bij aan duurzame gebouwde omgeving",
      "status": "ok",
      "toelichting": "Gebouwrenovatie van een monument uit 1742 naar label A+ versterkt duurzaamheid van de bestaande bebouwde omgeving. Relevant voor SDG 11.4 (cultureel en erfgoed beschermen)."
    },
    {
      "sdg_nr": "SDG 13",
      "sdg_naam": "Klimaatactie",
      "sdg_icoon_kleur": "#3F7E44",
      "relevantie": "hoog",
      "maatregel": "Hybride warmtepomp (gasreductie) + gehele maatregelenpakket",
      "bewijs": "35% CO₂-reductie; geschatte reductie ~3,7 tCO₂e/jr op basis van scope 1+2 berekening",
      "doelstelling_2030": "NL Klimaatakkoord: 55% CO₂-reductie in 2030 t.o.v. 1990; gebouwde omgeving verantwoordelijk voor 15% van NL-emissies",
      "status": "ok",
      "toelichting": "Warmtepomp verlaagt gasverbruik significant. Met 35% CO₂-reductie levert dit pand een concrete bijdrage aan SDG 13.2 (klimaatmaatregelen in nationaal beleid)."
    },
    {
      "sdg_nr": "SDG 9",
      "sdg_naam": "Industrie, innovatie en infrastructuur",
      "sdg_icoon_kleur": "#FD6925",
      "relevantie": "middel",
      "maatregel": "Slimme thermostaat + hybride warmtepomp (smart building technologie)",
      "bewijs": "Installatie van smart building componenten; energiemanagement via domotica",
      "doelstelling_2030": "Bijdrage aan digitalisering gebouwde omgeving en smart grid integratie",
      "status": "kwalitatief",
      "toelichting": "Slimme thermostaat en hybride systemen dragen bij aan innovatieve energie-infrastructuur. Kwalitatief onderbouwd; kwantitatieve meting vereist monitoring na installatie."
    },
    {
      "sdg_nr": "SDG 12",
      "sdg_naam": "Verantwoorde consumptie en productie",
      "sdg_icoon_kleur": "#BF8B2E",
      "relevantie": "middel",
      "maatregel": "HR++ glas en isolatie (vermindering energieverbruik)",
      "bewijs": "€ 2.300/jr lagere energiekosten = ~20.000 kWh/jr minder primair energieverbruik (geschat)",
      "doelstelling_2030": "NL-doelstelling energiebesparing gebouwde omgeving: 40% lager energieverbruik in 2030",
      "status": "ok",
      "toelichting": "Isolatiemaatregelen reduceren structureel de energievraag. Bijdrage aan SDG 12.2 (duurzaam beheer en gebruik van natuurlijke hulpbronnen)."
    },
    {
      "sdg_nr": "SDG 8",
      "sdg_naam": "Waardig werk en economische groei",
      "sdg_icoon_kleur": "#A21942",
      "relevantie": "laag",
      "maatregel": "Verduurzamingsinvestering (€ 29.900 in lokale economie)",
      "bewijs": "Investering in lokale installatiebedrijven en glaszetters; werkgelegenheid in duurzaamheidssector",
      "doelstelling_2030": "Bijdrage aan groene arbeidsmarkt NL",
      "status": "kwalitatief",
      "toelichting": "Indirecte economische bijdrage via lokale aannemers. Moeilijk kwantitatief te onderbouwen voor dit object."
    }
  ],

  "gaps": [
    {
      "categorie": "Emissies",
      "titel": "Scope 1 en 2 emissies niet exact berekend in verduurzamingsrapport",
      "omschrijving": "Het verduurzamingsrapport vermeldt 'nader te bepalen' voor CO₂-emissies. Voor een volledig ESG-bankdossier zijn exact berekende scope 1 en 2 emissies verplicht (SFDR PAI-1, Pillar 3 EBA). Op basis van energiedata zijn indicatieve berekeningen gemaakt, maar officiële energiemeting ontbreekt.",
      "actie": "Energiemeting laten uitvoeren (NEN 7120 of gelijkwaardig); gasverbruik ophalen bij netbeheerder voor voorgaande 2 jaar",
      "tijdlijn": "Binnen 3 maanden — verplicht voor bankfinanciering",
      "ernst": "kritiek"
    },
    {
      "categorie": "Governance",
      "titel": "Formeel duurzaamheidsbeleid eigenaar ontbreekt",
      "omschrijving": "Voor ESG-gelinkte financiering en CSRD-compliance is een formeel gedocumenteerd duurzaamheidsbeleid van de eigenaar vereist. Dit bevat doelstellingen, verantwoordelijkheden en rapportageverplichtingen. Dit ontbreekt volledig in het huidige dossier.",
      "actie": "Eénpagina duurzaamheidsbeleid opstellen met: klimaatdoelen, rapportagecyclus, verantwoordelijke personen",
      "tijdlijn": "Binnen 6 maanden — vereist voor ESG-covenant bij financiering",
      "ernst": "kritiek"
    },
    {
      "categorie": "Energie",
      "titel": "Energieverbruik historisch niet geverifieerd",
      "omschrijving": "Het verduurzamingsrapport gebruikt indicatief gasverbruik (5.978 m³) op basis van energielabel, niet op basis van werkelijke meteropnames. Voor bankrapportage (Pillar 3, SFDR) zijn werkelijke verbruikscijfers over minimaal 12 maanden vereist.",
      "actie": "Werkelijke energieverbruiksdata (gas + elektra) ophalen over 2023 en 2024 bij netbeheerder",
      "tijdlijn": "Binnen 3 maanden",
      "ernst": "ontbreekt"
    },
    {
      "categorie": "Sociaal",
      "titel": "Sociale impact op gebruikers niet gekwantificeerd",
      "omschrijving": "Impact op recreatiegasten en bedrijfswoning-bewoner (comfort, binnenklimaat, gezondheid) is kwalitatief beschreven maar niet gemeten. ESRS S1 vereist kwantitatieve indicatoren voor 2026.",
      "actie": "Gebruikerstevredenheidsonderzoek uitvoeren voor en na verduurzaming; binnenklimaatmeting laten verrichten",
      "tijdlijn": "Binnen 1 jaar — bij oplevering maatregelen",
      "ernst": "waarschuwing"
    },
    {
      "categorie": "Keten",
      "titel": "Scope 3 emissies niet bepaald",
      "omschrijving": "Scope 3 (embodied carbon van bouwmaterialen, transport, leveranciersketen) is niet bepaald. Hoewel dit voor kleine eigenaren niet direct verplicht is, verwachten institutionele financiers dit wel voor 2026.",
      "actie": "LCA (levenscyclusanalyse) of vereenvoudigde embodied carbon berekening laten uitvoeren bij dakisolatie- en glasvervanging",
      "tijdlijn": "Bij uitvoering Fase 1 maatregelen",
      "ernst": "waarschuwing"
    },
    {
      "categorie": "Juridisch",
      "titel": "EU Taxonomie-alignment nog niet aangetoond",
      "omschrijving": "Het pand kwalificeert waarschijnlijk als Taxonomie-eligible (activiteit 7.7 Renovatie bestaande gebouwen), maar Taxonomie-aligned is nog niet aangetoond. Hiervoor zijn DNSH-documentatie en minimum sociale waarborgen vereist.",
      "actie": "Taxonomie-alignment traject starten: DNSH-toets documenteren, minimum social safeguards vastleggen",
      "tijdlijn": "Parallel aan financieringsaanvraag",
      "ernst": "ontbreekt"
    }
  ],

  "subsidie_overzicht": [
    {
      "code": "ISDE",
      "naam": "Investeringssubsidie Duurzame Energie en Energiebesparing (zakelijk)",
      "type": "directe subsidie",
      "bedrag": "€ 1.500 – € 5.000 (afhankelijk van type warmtepomp)",
      "van_toepassing_op": "Hybride warmtepomp",
      "actie_vereist": "AANVRAGEN VÓÓR ondertekening offerte via Mijn RVO met eHerkenning niveau 2+",
      "deadline": "Vóór offerte ondertekening — recht vervalt daarna"
    },
    {
      "code": "EIA",
      "naam": "Energie-investeringsaftrek",
      "type": "fiscale aftrek (VPB/IB)",
      "bedrag": "40% aftrek fiscale winst — bij € 29.900 investering ca. € 3.086 voordeel (25,8% VPB)",
      "van_toepassing_op": "Isolatie, beglazing, klimaatinstallatie, zonnepanelen",
      "actie_vereist": "Melding via eLoket RVO binnen 3 maanden na ondertekening offerte",
      "deadline": "Binnen 3 maanden na offerte"
    },
    {
      "code": "KIA",
      "naam": "Kleinschaligheidsinvesteringsaftrek",
      "type": "fiscale aftrek (VPB/IB)",
      "bedrag": "28% extra aftrek — bij € 29.900 ca. € 2.160 voordeel",
      "van_toepassing_op": "Alle maatregelen",
      "actie_vereist": "Geen aparte aanvraag; accountant verwerkt automatisch in VPB/IB-aangifte",
      "deadline": null
    },
    {
      "code": "SDE++",
      "naam": "Stimulering Duurzame Energieproductie en Klimaattransitie",
      "type": "exploitatiesubsidie",
      "bedrag": "Vaste subsidie per geproduceerde kWh over 15 jaar (< 15 kWp: waarschijnlijk niet van toepassing)",
      "van_toepassing_op": "Zonnepanelen uitbreiding — alleen bij > 15 kWp",
      "actie_vereist": "Check of uitbreiding de 15 kWp grens overschrijdt; aanvraag tijdens openstellingsronde",
      "deadline": "Openstellingsronde voorjaar/najaar"
    },
    {
      "code": "Saldering",
      "naam": "Salderingsregeling zonnepanelen",
      "type": "nettometing teruglevering",
      "bedrag": "Teruggeleverde stroom wegstrepen tegen afgenomen stroom (afbouw vanaf 2027)",
      "van_toepassing_op": "Huidige 10 en uitgebreide zonnepanelen",
      "actie_vereist": "Installeer zo snel mogelijk — regeling wordt jaarlijks afgebouwd; in 2027 nog 64% saldering",
      "deadline": "Hoe eerder installatie, hoe meer voordeel"
    }
  ],

  "financieringsadvies": {
    "aanbevolen_structuur": "Aanbevolen is een ESG-linked lening met duurzaamheidsgebonden rentemarge. Koppel de rente aan het behalen van energielabel A+ en CO₂-reductiedoelstelling. Bij volledige uitvoering maatregelen kwalificeert het object voor groene financiering met een rentemarge-voordeel van 15-30 basispunten. BMKB-Groen is toepasbaar bij zakelijke financiering tot € 1,5 mln.",
    "bmkb_groen": true,
    "eigen_inbreng_aanbevolen": "20% (€ 5.980 van € 29.900)",
    "looptijd_aanbevolen": "10 jaar",
    "maandlast_schatting": "€ 983/mnd (energie € 827 + aflossing € 156)",
    "esg_linked_voordelen": "Duurzaamheids-KPI: label A+ behalen binnen 2 jaar → 15-25 bp rentemarge-voordeel; CO₂-reductie ≥30% → aanvullende 5-10 bp korting",
    "green_loan_kwalificatie": "Kwalificeert als Green Loan (LMA Green Loan Principles) na uitvoering maatregelen en documentatie ESRS-velden"
  },

  "risicosignalering": [
    {
      "risico": "Stranded asset risico: label C pand na regelgeving 2030",
      "categorie": "regulatoir",
      "kans": "middel",
      "impact": "hoog",
      "mitigatie": "Uitvoering verduurzamingsplan binnen 2 jaar; label A+ bereikt vóór eventuele labelplicht recreatievastgoed"
    },
    {
      "risico": "Hoge binnentemperaturen door rieten dak zonder isolatie",
      "categorie": "klimaat",
      "kans": "hoog",
      "impact": "middel",
      "mitigatie": "Dakisolatie opnemen in Fase 4; aanvullende zonwering als tussenoplossing; bewonerscomfort monitoren"
    },
    {
      "risico": "Stijgende energiekosten verhogen exploitatielasten",
      "categorie": "financieel",
      "kans": "middel",
      "impact": "hoog",
      "mitigatie": "Verduurzamingsmaatregelen uitgevoerd voor 2027 beschermen tegen tariefstijgingen; energiebesparing € 2.300/jr reduceert exposure"
    },
    {
      "risico": "Terugverdientijd HR++ glas (25 jaar) lang t.o.v. financieringslooptijd",
      "categorie": "financieel",
      "kans": "laag",
      "impact": "laag",
      "mitigatie": "HR++ glas heeft waardebehoudend karakter voor het monument en draagt bij aan energielabel; niet puur op cashflow beoordelen"
    },
    {
      "risico": "Dakisolatie (€ 100.000) niet meegenomen in verduurzamingslening",
      "categorie": "financieel",
      "kans": "middel",
      "impact": "middel",
      "mitigatie": "Separate financieringsstructuur voor dakisolatie overwegen; combineren met regulier onderhoudskrediet"
    }
  ],

  "stappenplan": [
    {
      "stap": 1,
      "titel": "Energiedata verzamelen en ESG-nulmeting opstellen",
      "omschrijving": "Werkelijke energieverbruiksdata (gas + elektra 2023-2024) ophalen bij netbeheerder. Officiële scope 1+2 berekening maken conform ESRS E1-6. Dit vormt de basis voor het bankdossier en SFDR-rapportage.",
      "tijdlijn": "Maand 1 — vóór financieringsaanvraag",
      "actoren": "Eigenaar + MB Adviesgroep + netbeheerder",
      "resultaat": "Geverifieerde emissie-baseline voor bankdossier"
    },
    {
      "stap": 2,
      "titel": "ISDE en EIA aanvragen vóór offerteondertekening",
      "omschrijving": "ISDE aanvragen voor warmtepomp via Mijn RVO (eHerkenning). EIA-melding voorbereiden voor isolatie en beglazing. Na ondertekening offerte vervalt ISDE-recht — tijdigheid is cruciaal.",
      "tijdlijn": "Maand 1-2 — parallel aan offertetraject",
      "actoren": "Eigenaar + accountant + MB Adviesgroep",
      "resultaat": "Subsidierechten veiliggesteld; netto investering daalt naar € 24.654"
    },
    {
      "stap": 3,
      "titel": "Fase 1 uitvoeren: quick wins en schilverbetering",
      "omschrijving": "Slimme thermostaat, geïsoleerde buitendeuren en HR++ glas. Focus op snel comfort en gasbesparing. Synergie: betere schil verhoogt rendement warmtepomp in Fase 2.",
      "tijdlijn": "Maand 2-6",
      "actoren": "Glaszetter + installatiebedrijf",
      "resultaat": "€ 900/jr besparing; schilverbeteringsdocumentatie voor bankdossier"
    },
    {
      "stap": 4,
      "titel": "Fase 2+3: hybride warmtepomp en zonnepanelen uitbreiden",
      "omschrijving": "Hybride warmtepomp installeren (TVT 6 jaar) en zonnepanelen uitbreiden naar 15 panelen. Na uitvoering: scope 1 emissies dalen significant, hernieuwbaar aandeel stijgt.",
      "tijdlijn": "Maand 4-10",
      "actoren": "RVO-erkend installatiebedrijf + zonnepanelenleverancier",
      "resultaat": "€ 1.400/jr extra besparing; label bereikt B/A; scope 1+2 reductie ≥25%"
    },
    {
      "stap": 5,
      "titel": "ESG-dossier completeren voor bankrapportage",
      "omschrijving": "Na uitvoering Fase 1-3: werkelijke emissies meten, ESRS-velden invullen met gemeten data, duurzaamheidsbeleid document opstellen, Taxonomie DNSH-toets documenteren. Dit dossier vormt de onderbouwing voor ESG-linked financiering.",
      "tijdlijn": "Maand 10-12",
      "actoren": "MB Adviesgroep + accountant + eigenaar",
      "resultaat": "Compleet ESRS/SFDR-bankdossier; kwalificatie groene lening; Credion ESG-score A"
    },
    {
      "stap": 6,
      "titel": "Jaarlijkse ESG-monitoring instellen",
      "omschrijving": "Energiemonitoring via slimme meter activeren. Jaarlijkse rapportage scope 1+2 emissies, energieverbruik en hernieuwbaar aandeel. Voor ESG-linked lening: KPI-monitoring rapportage aan bank.",
      "tijdlijn": "Vanaf maand 12 — jaarlijks",
      "actoren": "Eigenaar + netbeheerder + MB Adviesgroep",
      "resultaat": "Continue ESRS-compliance; rentemarge-voordeel bij KPI-haling behouden"
    }
  ]
}

RAPPORTTEKST VAN HET VERDUURZAMINGSRAPPORT:
${rapportTekst}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Je bent een senior ESG/ESRS-bankadviseur. Je maakt GEEN samenvatting van het verduurzamingsrapport maar een AANVULLEND bankdossier met ESRS-rapportage, SFDR-classificatie, EU Taxonomie-toets, klimaatrisico-analyse en ESG-financieringsadvies. Je geeft uitsluitend valide JSON terug, zonder markdown, zonder uitleg. Begin direct met { en eindig met }."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const raw = response.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const clean = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse error. Raw (eerste 1000):", raw.substring(0, 1000));
      return res.status(500).json({
        error: "De AI gaf geen geldige JSON terug",
        detail: parseErr.message,
        raw_preview: raw.substring(0, 500)
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      error: error.message || "Onbekende serverfout"
    });
  }
}
