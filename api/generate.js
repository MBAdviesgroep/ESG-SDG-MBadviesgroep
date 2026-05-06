import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ══════════════════════════════════════════════════════════════
// ALLE 17 SDGs — hardcoded database (bron: United Nations)
// ══════════════════════════════════════════════════════════════
const SDG_DATABASE = {
  "1":  { kleur: "#E5243B", label: "Geen armoede",                        target: "1.4 — Gelijke toegang tot economische middelen" },
  "2":  { kleur: "#DDA63A", label: "Geen honger",                         target: "2.4 — Duurzame voedselproductie" },
  "3":  { kleur: "#4C9F38", label: "Goede gezondheid en welzijn",         target: "3.9 — Minder ziekten door vervuiling en schadelijke stoffen" },
  "4":  { kleur: "#C5192D", label: "Kwaliteitsonderwijs",                 target: "4.7 — Onderwijs voor duurzame ontwikkeling" },
  "5":  { kleur: "#FF3A21", label: "Gendergelijkheid",                    target: "5.1 — Gelijke rechten voor vrouwen en meisjes" },
  "6":  { kleur: "#26BDE2", label: "Schoon water en sanitair",            target: "6.4 — Waterzuinig gebruik en waterkwaliteit" },
  "7":  { kleur: "#FCC30B", label: "Betaalbare en duurzame energie",      target: "7.2 — Aandeel hernieuwbare energie verhogen · 7.3 — Energie-efficiëntie verdubbelen" },
  "8":  { kleur: "#A21942", label: "Waardig werk en economische groei",   target: "8.4 — Efficiënter gebruik grondstoffen · 8.8 — Veilige werkomstandigheden" },
  "9":  { kleur: "#FD6925", label: "Industrie, innovatie & infrastructuur", target: "9.4 — Duurzame en schone technologieën in industrie en infrastructuur" },
  "10": { kleur: "#DD1367", label: "Minder ongelijkheid",                 target: "10.2 — Iedereen meedoen ongeacht inkomen of achtergrond" },
  "11": { kleur: "#FD9D24", label: "Duurzame steden en gemeenschappen",   target: "11.6 — Minder milieu-impact steden · 11.4 — Cultureel erfgoed beschermen" },
  "12": { kleur: "#BF8B2E", label: "Verantwoorde consumptie en productie",target: "12.2 — Duurzaam beheer grondstoffen · 12.5 — Afval en verspilling verminderen" },
  "13": { kleur: "#3F7E44", label: "Klimaatactie",                        target: "13.1 — Weerbaarheid klimaatrisico · 13.2 — Klimaat in nationaal beleid" },
  "14": { kleur: "#0A97D9", label: "Leven in het water",                  target: "14.1 — Minder vervuiling zeeën en oceanen" },
  "15": { kleur: "#56C02B", label: "Leven op het land",                   target: "15.5 — Verlies biodiversiteit stoppen · 15.8 — Invasieve soorten beperken" },
  "16": { kleur: "#00689D", label: "Vrede, rechtvaardigheid en sterke publieke diensten", target: "16.6 — Transparante en verantwoorde instituties" },
  "17": { kleur: "#19486A", label: "Partnerschap voor de doelen",         target: "17.17 — Publiek-private samenwerking voor duurzame doelen" }
};

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

    // SDG database meegeven in de prompt zodat AI exact de juiste nummers gebruikt
    const sdgLijst = Object.entries(SDG_DATABASE)
      .map(([nr, s]) => `SDG ${nr}: ${s.label} — ${s.target}`)
      .join("\n");

    const prompt = `Je bent een senior ESG/ESRS-bankadviseur bij een institutionele vastgoedfinancier.

Je ontvangt een verduurzamingsrapport van een vastgoedeigenaar. Maak een AANVULLEND ESG-bankdossier — 
geen samenvatting, maar een financieel/regelgevend dossier voor bank en investeerder.

════════════════════════════════════════
SDG KOPPELINGSREGEL (VERPLICHT)
════════════════════════════════════════
ALLE 17 VN-DUURZAAMHEIDSDOELEN (gebruik uitsluitend deze nummers):

SDG-KOPPELINGSREGEL — DIFFERENTIEER PER MAATREGEL:
Elke maatregel heeft een ANDERE set SDGs. Gebruik de aard van de maatregel als uitgangspunt.

ISOLATIEMAATREGELEN (dak, gevel, vloer, glas):
→ Sterke kandidaten: SDG 3 (gezondheid: minder tocht/vocht), SDG 7 (energiebesparing), SDG 11 (betere woonomgeving), SDG 12 (minder energieverspilling), SDG 13 (CO₂-reductie)
→ Overweeg ook: SDG 1 (lagere energierekening bewoners), SDG 8 (lokale uitvoerder)
→ Minder relevant: SDG 9 (geen innovatieve technologie), SDG 17

INSTALLATIEMAATREGELEN (warmtepomp, HR-ketel, ventilatie):
→ Sterke kandidaten: SDG 7 (efficiëntere energie), SDG 9 (innovatieve technologie), SDG 13 (CO₂-reductie scope 1)
→ Overweeg ook: SDG 3 (betere luchtkwaliteit), SDG 8 (gespecialiseerde installateur), SDG 11 (minder uitstoot in omgeving)
→ Minder relevant: SDG 12, SDG 15

OPWEKKINGSMAATREGELEN (zonnepanelen, WKK):
→ Sterke kandidaten: SDG 7 (hernieuwbare opwek), SDG 9 (technologie-innovatie), SDG 13 (CO₂-reductie scope 2)
→ Overweeg ook: SDG 10 (betaalbare energie voor iedereen), SDG 12 (eigen opwek vervangt fossiel)
→ Minder relevant: SDG 3, SDG 11

MONITORING/GEDRAGSMAATREGELEN (thermostaat, energiemanagementsysteem):
→ Sterke kandidaten: SDG 12 (bewust verbruik, geen verspilling), SDG 9 (slimme technologie), SDG 17 (data delen met adviseur/financier)
→ Overweeg ook: SDG 4 (bewustwording gebruikers), SDG 7 (efficiënter energiegebruik)
→ Minder relevant: SDG 13 (kleine directe CO₂-impact), SDG 15

ALGEMENE REGELS:
- SDG 8 (werkgelegenheid): JA bij grote maatregelen met significante uitvoeringskosten (>€2.000), NEE bij kleine maatregelen
- SDG 15 (natuur): JA alleen als het rapport expliciet vermeldt dat de locatie buiten Natura 2000 ligt
- SDG 16 (instituties): JA alleen als het rapport vermeldt dat uitvoering conform OECD/ILO plaatsvindt

UITLEG-VEREISTE: gebruik altijd maatregel-specifieke cijfers.
- Isolatie: "bespaart X kWh/jr door Rc-waarde van Y"
- Installatie: "reduceert gasverbruik met X m³/jr, besparing € Y/jr"
- Opwek: "wekt X kWh/jr op, vervangt X% van netafname"
- Monitoring: "reduceert verspilling met X%, besparing € Y/jr"

VARIEER DE UITLEG: elke maatregel heeft unieke uitleg, ook al deelt hij een SDG met een andere maatregel.
${sdgLijst}

════════════════════════════════════════
MAATREGELEN — VERPLICHT
════════════════════════════════════════
Neem ALLE maatregelen op die in het verduurzamingsrapport staan — niet alleen de eerste.
Elke maatregel krijgt een eigen object in de maatregelen-array.
Gebruik de exacte namen, bedragen en cijfers uit het rapport.
Loop voor elke maatregel alle 17 SDGs langs zoals beschreven.

════════════════════════════════════════
SCOREBEREKENING — VERPLICHT
════════════════════════════════════════
Bereken alle vijf radar-scores (0-100) op basis van het ingediende rapport.
Gebruik de berekenwijze die per score-veld staat beschreven in het JSON-schema.
Bereken daarna de gewogen bankscore: (Transitierisico×0.25) + (Datakwaliteit×0.20) + (Bewijsniveau×0.20) + (Klimaatrisico×0.15) + (Rapportage×0.20).
Pas de bankscore_oordeel aan op basis van de berekende score.
Geef nooit de standaard voorbeeldwaarden terug — bereken altijd op basis van het rapport.

════════════════════════════════════════
BEREKENINGSREGELS
════════════════════════════════════════
• Scope 1 CO₂ aardgas: m³ × 1,785 kg CO₂/m³ ÷ 1000 = tCO₂e/jr
  (indicatief gasverbruik: € gaskosten ÷ 1,10 €/m³ = m³/jr)
• Scope 2 CO₂ locatie-gebaseerd: kWh_netto × 0,420 kg CO₂/kWh ÷ 1000 = tCO₂e/jr
• CO₂-intensiteit: totaal_tCO₂e ÷ VVO_m² = kg CO₂/m²/jr
• Energieintensiteit: kWh_totaal ÷ VVO_m² = kWh/m²/jr

════════════════════════════════════════
TOON EN STIJL
════════════════════════════════════════
• Schrijf vanuit bankperspectief
• Wees specifiek: exacte getallen, geen "nader te bepalen"
• Voeg interpretatie toe: wat betekent dit voor de financierbaarheid?

Retourneer UITSLUITEND valide JSON — geen markdown, geen uitleg buiten de JSON.

{
  "object_naam": "officiële naam pand",
  "object_adres": "volledig adres",
  "datum_rapport": "datum",
  "huidig_label": "huidige energielabelklasse",
  "streef_label": "streef label na maatregelen",
  "functie": "gebruiksfunctie",
  "bouwjaar": "bouwjaar",
  "oppervlakte": "m² VVO",
  "samenvatting": "3-4 zinnen vanuit bankperspectief over kredietrelevantie, ESG-risicoprofiel en taxonomie-geschiktheid",

  "huidige_energiekosten": "€ X.XXX per jaar",
  "besparing_jaar": "€ X.XXX per jaar",
  "totaal_investering": "€ XX.XXX bruto",
  "gemiddelde_tvt": "X,X jaar",
  "co2_reductie_pct": "XX%",
  "co2_reductie_abs": "X,X tCO₂e/jr",

  "scope1_co2": "X,X tCO₂e/jr",
  "scope2_co2_locatie": "X,X tCO₂e/jr",
  "scope1_co2_na": "X,X tCO₂e/jr na maatregelen",
  "scope2_co2_na": "X,X tCO₂e/jr na maatregelen",
  "totaal_co2_huidig": "X,X tCO₂e/jr",
  "totaal_co2_na": "X,X tCO₂e/jr",

  "bankscore": "BEREKEN: (Transitierisico×0.25)+(Datakwaliteit×0.20)+(Bewijsniveau×0.20)+(Klimaatrisico×0.15)+(Rapportage×0.20) — geef een heel getal terug, GEEN string",
  "bankscore_oordeel": "Bepaal op basis van berekende score: <50=Niet geschikt voor groene financiering, 50-64=Beperkt geschikt, 65-74=Voorwaardelijk geschikt voor groene financiering, 75-84=Geschikt voor groene financiering, 85+=Sterk geschikt voor groene financiering",

  "bankscore_componenten": [
    {"l": "ESG-score (gewogen)", "v": "XX / 100 — vul in op basis van berekende bankscore"},
    {"l": "Bewijsniveau", "v": "Niveau X / 4 — bepaal op basis van beschikbare documentatie in rapport"},
    {"l": "Datakwaliteit", "v": "Omschrijf kwaliteit van de data in het rapport: ontbrekend/indicatief/gevalideerd/geverifieerd"},
    {"l": "Beleidsrisico energie", "v": "Laag/Middel/Hoog — beoordeel op basis van huidig energielabel en afstand tot labelplicht"},
    {"l": "Klimaatrisico (fysiek)", "v": "Laag/Middel/Hoog — beoordeel op basis van locatie (overstromingsrisico, hitte, droogte)"},
    {"l": "Rapportagegereedheid", "v": "Indicatief/Gedeeltelijk/Officieel — op basis van volledigheid van het dossier"}
  ],

  "radar": [
    {
      "l": "Transitierisico",
      "v": "BEREKEN_OP_BASIS_VAN_RAPPORT — gebruik GEEN voorbeeldwaarde. Beoordeel: huidig energielabel, afstand tot doellabel, maatregelen aanwezig? Label G zonder plan = 20-35. Label C met plan naar A+ = 65-80. Label A al bereikt = 85-95.",
      "INSTRUCTIE": "Vervang de string hierboven door een heel getal tussen 0 en 100."
    },
    {
      "l": "Datakwaliteit",
      "v": "BEREKEN_OP_BASIS_VAN_RAPPORT — gebruik GEEN voorbeeldwaarde. Beoordeel: zijn gas m³ en elektra kWh aanwezig? Zijn kosten onderbouwd? Traceerbare berekeningen? Alleen label = 30-40. Volledige verbruiksdata = 80-95.",
      "INSTRUCTIE": "Vervang de string hierboven door een heel getal tussen 0 en 100."
    },
    {
      "l": "Bewijsniveau",
      "v": "BEREKEN_OP_BASIS_VAN_RAPPORT — gebruik GEEN voorbeeldwaarde. Niveau 1 (alleen PDF) = 20-30. Niveau 2 (PDF + berekeningen) = 45-55. Niveau 3 (gevalideerde data + kengetallen) = 70-80. Niveau 4 (meterdata na oplevering) = 90-100.",
      "INSTRUCTIE": "Vervang de string hierboven door een heel getal tussen 0 en 100."
    },
    {
      "l": "Klimaatrisico",
      "v": "BEREKEN_OP_BASIS_VAN_RAPPORT — gebruik GEEN voorbeeldwaarde. Hoog risico = lage score. Kustgebied/laaggelegen/stedelijk = 40-60. Binnenland/hooggelegen = 65-80. Gebruik het adres uit het rapport.",
      "INSTRUCTIE": "Vervang de string hierboven door een heel getal tussen 0 en 100."
    },
    {
      "l": "Rapportage",
      "v": "BEREKEN_OP_BASIS_VAN_RAPPORT — gebruik GEEN voorbeeldwaarde. Beoordeel volledigheid: ESRS E1 invulbaar? SFDR PAI-data beschikbaar? Taxonomie-toets uitvoerbaar? Summier rapport = 40-55. Volledig dossier met berekeningen = 80-95.",
      "INSTRUCTIE": "Vervang de string hierboven door een heel getal tussen 0 en 100."
    }
  ],

  "maatregelen": [
    {
      "INSTRUCTIE": "VERPLICHT: neem ALLE maatregelen op die in het verduurzamingsrapport staan. Niet alleen de eerste. Elke maatregel krijgt een eigen object in deze array. Gebruik exact de namen, bedragen en cijfers uit het rapport.",
      "nr": "M1",
      "naam": "exacte naam maatregel 1 uit het rapport",
      "capex": 0,
      "bes": 0,
      "co2": 0.0,
      "tvt": 0.0,
      "subs": 0,
      "label": "+0",
      "scope": "Scope 1 of Scope 2 of Scope 1+2",
      "omschrijving": "ESG-relevantie van deze specifieke maatregel",
      "sdg_koppelingen": [
        {
          "sdg_nr": "7",
          "uitleg": "Concrete uitleg met cijfers uit het rapport voor maatregel 1."
        },
        {
          "sdg_nr": "13",
          "uitleg": "Concrete uitleg met CO₂-cijfers voor maatregel 1."
        }
      ]
    },
    {
      "nr": "M2",
      "naam": "exacte naam maatregel 2 uit het rapport",
      "capex": 0,
      "bes": 0,
      "co2": 0.0,
      "tvt": 0.0,
      "subs": 0,
      "label": "+0",
      "scope": "Scope 1 of Scope 2 of Scope 1+2",
      "omschrijving": "ESG-relevantie van deze specifieke maatregel",
      "sdg_koppelingen": [
        {
          "sdg_nr": "7",
          "uitleg": "Concrete uitleg voor maatregel 2."
        }
      ]
    },
    {
      "INSTRUCTIE_VERVOLG": "Voeg hier alle overige maatregelen toe uit het rapport op dezelfde manier. Het aantal objecten in deze array moet gelijk zijn aan het aantal maatregelen in het rapport."
    }
  ],

  "risicos": [
    {
      "risk": "Omschrijving risico",
      "ernst": "Hoog | Middel | Laag",
      "horizon": "Kort | Lang",
      "action": "Concrete bankactie"
    }
  ],

  "voorwaarden": [
    "Voorwaarde 1",
    "Voorwaarde 2"
  ],

  "monitoring": [
    "Monitoring punt 1",
    "Monitoring punt 2"
  ],

  "vervolg": [
    "Stap 1: ...",
    "Stap 2: ..."
  ],

  "samenvatting_punten": [
    "Punt 1 — besluitgericht",
    "Punt 2 — besluitgericht",
    "Punt 3 — besluitgericht",
    "Punt 4 — besluitgericht"
  ],

  "assurance_niveau": 3,
  "assurance_tekst": "Conclusie en aanbevolen vervolgstap in maximaal 4 zinnen.",

  "evidence": [
    {"ond": "Object, functie, bouwjaar", "w": "...", "bron": "BAG/Kadaster", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Energielabel huidig → doel", "w": "C → A+++", "bron": "EP-online", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Maatregelenpakket capex", "w": "€ 29.900", "bron": "Bron-rapport", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Energiekosten huidig", "w": "€ 12.229/jaar", "bron": "Bron-rapport", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Jaarlijkse besparing", "w": "€ 2.300/jaar", "bron": "Bron-rapport", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "CO₂-reductie", "w": "35% · ca. 4,2 ton/jaar", "bron": "Berekening", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Break-even punt", "w": "Jaar 11", "bron": "Cumulatieve curve", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "Taxonomie-eligibility", "w": "7.2 Eligible + Aligned", "bron": "EU Taxonomy Annex I", "z": "Hoog", "actie": "Geverifieerd"},
    {"ond": "DNSH-toets", "w": "6 doelen voldaan", "bron": "ESG Bridge", "z": "Hoog", "actie": "Geverifieerd"}
  ],

  "missing": [
    {"stuk": "Eindoplevering nieuw energielabel", "prio": "Middel", "actie": "EP-online registratie na uitvoering"},
    {"stuk": "Subsidiebeschikking RVO", "prio": "Laag", "actie": "EIA / ISDE aanvragen"},
    {"stuk": "Uitvoeringsplanning", "prio": "Hoog", "actie": "Mijlpalen + trekkingsschema"},
    {"stuk": "DNSH-bewijs & sociale waarborgen", "prio": "Middel", "actie": "Per milieudoel onderbouwen"}
  ],

  "esrs": [
    {"code": "ESRS E1-1", "punt": "Transitieplan klimaatverandering", "status": "beschikbaar", "bron": "Maatregelenpakket + planning"},
    {"code": "ESRS E1-3", "punt": "Acties & middelen klimaattransitie", "status": "beschikbaar", "bron": "Verduurzamingsadvies, capex € 29.900"},
    {"code": "ESRS E1-4", "punt": "Doelstellingen klimaatmitigatie", "status": "beschikbaar", "bron": "CO₂-reductie 35%"},
    {"code": "ESRS E1-5", "punt": "Energieverbruik & energiemix", "status": "beschikbaar", "bron": "Bron-rapport"},
    {"code": "ESRS E1-6", "punt": "Bruto Scope 1 / 2 GHG-emissies", "status": "beschikbaar", "bron": "Berekening per scope"},
    {"code": "ESRS E1-7", "punt": "GHG removals & mitigatieprojecten", "status": "beschikbaar", "bron": "Eigen opwek (PV)"},
    {"code": "ESRS E5-1", "punt": "Hulpbronnen / circulaire bouw", "status": "afgeleid", "bron": "Materiaalspecificatie"},
    {"code": "ESRS S4-1", "punt": "Eindgebruikers & comfortimpact", "status": "beschikbaar", "bron": "Wooncomfort & binnenklimaat"},
    {"code": "ESRS G1-1", "punt": "Governance & datakwaliteit", "status": "beschikbaar", "bron": "ESG Bridge · MB Adviesgroep"}
  ],

  "sfdr": "Uitleg SFDR Artikel 8 in gewone taal met concrete PAI-cijfers uit het rapport.",
  "pai": [
    "PAI 1 — CO₂-uitstoot (scope 1+2): daalt met X% na uitvoering.",
    "PAI 17 — Energieverbruik per m²: van X naar X kWh/m²/jaar.",
    "PAI 18 — Fossiel-afhankelijk vastgoed: valt na uitvoering niet meer onder slecht presterend."
  ],
  "pillar3": "Uitleg Pillar 3 in gewone taal met concrete labelstappen en GAR-relevantie.",

  "taxonomie": {
    "activiteit": "7.2 Renovatie van bestaande gebouwen",
    "eligibility": "In aanmerking (Eligible)",
    "alignment": "Voldoet (Aligned) — X labelstappen + energiereductie X%",
    "contribution": "Uitleg EU Taxonomie 7.2 in gewone taal met specifieke cijfers uit het rapport.",
    "dnsh": [
      {"l": "Klimaatadaptatie", "v": "Risicoscan uitgevoerd — laag tot middel risico"},
      {"l": "Water", "v": "Geen impact — geen waterintensieve installatie"},
      {"l": "Circulaire economie", "v": "Materiaalplan aanwezig — hergebruik van materialen"},
      {"l": "Vervuiling", "v": "Asbestvrij pand — lage-emissie materialen"},
      {"l": "Natuur & biodiversiteit", "v": "Locatie buiten Natura 2000-gebieden"},
      {"l": "Sociale waarborgen", "v": "Uitvoering conform OECD- en ILO-richtlijnen"}
    ]
  },

  "co2_pad": [12.0, 11.6, 10.9, 9.8, 8.5, 7.8, 7.7, 7.6, 7.5, 7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8],
  "cashflow": [-24695, -22395, -20095, -17795, -15495, -13195, -10895, -8595, -6295, -3995, -1695, 605, 2905, 5205, 7505, 9805],
  "scope_voor": {"s1": 8.4, "s2": 3.6, "tot": 12.0},
  "scope_na": {"s1": 4.2, "s2": 3.6, "tot": 7.8},

  "label_pad": ["G","F","E","D","C","B","A","A+","A++","A+++","A++++"],
  "label_huidig_idx": 4,
  "label_streef_idx": 9,
  "primaire_energie_reductie_pct": 50,
  "co2_reductie_ton": 4.2,
  "bes_jaar": 2300,
  "capex_totaal": 29900,
  "capex_subsidie": 5205,
  "capex_eigen": 4695,
  "capex_lening": 20000,
  "rente_referentie": "5,15% → 4,90%",
  "rentekorting_bps": 25,
  "looptijd_jr": 15,

  "autorisatie": {
    "analist": "M. Bergkamp — Senior ESG-analist",
    "compliance": "Drs. J. de Vries — Compliance Officer",
    "kenmerk": "ESG-BR-2025-XXXX",
    "versie": "1.0 — Officieel"
  }
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
          content: "Je bent een senior ESG/ESRS-bankadviseur. Je maakt een AANVULLEND bankdossier met ESRS-rapportage, SFDR-classificatie, EU Taxonomie-toets en ESG-financieringsadvies. BELANGRIJK: Bij sdg_koppelingen gebruik je UITSLUITEND de SDG-nummers die in de prompt zijn opgegeven (1-17). Loop voor elke maatregel alle 17 SDGs systematisch langs. Bereken alle vijf radar-scores als GEHELE GETALLEN (niet als strings) op basis van het rapport — de velden met 'BEREKEN_OP_BASIS_VAN_RAPPORT' moeten worden vervangen door een getal. Bereken daarna de gewogen bankscore als geheel getal. Gebruik specifieke cijfers uit het rapport. Geef uitsluitend valide JSON terug, zonder markdown. Begin direct met { en eindig met }."
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
      console.error("JSON parse error:", parseErr.message);
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
