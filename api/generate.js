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
Hieronder staan ALLE 17 officiële VN Sustainable Development Goals.
Gebruik UITSLUITEND de nummers en namen uit deze lijst.
VERPLICHTE WERKWIJZE PER MAATREGEL — SDG-BEOORDELING:
Ga voor ELKE maatregel uit het rapport alle 17 SDGs één voor één langs.
Beoordeel per SDG expliciet: draagt deze maatregel bij aan dit doel? Ja of nee, en waarom?
Neem alleen de SDGs op in sdg_koppelingen waarbij het antwoord JA is.

Gebruik deze redenering per SDG:
SDG 1  — Armoede: verlaagt de maatregel de energielasten voor bewoners/gebruikers?
SDG 2  — Honger: raakt de maatregel voedsel- of landbouwprocessen? (zelden ja bij gebouwen)
SDG 3  — Gezondheid: verbetert de maatregel luchtkwaliteit, binnenklimaat, vochtniveau of geluid?
SDG 4  — Onderwijs: draagt de maatregel bij aan kennisdeling of duurzaam gebouwgebruik?
SDG 5  — Gendergelijkheid: zorgt de maatregel voor gelijke toegang tot energie of comfort?
SDG 6  — Water: vermindert de maatregel waterverbruik of waterverontreiniging?
SDG 7  — Energie: verlaagt de maatregel het energieverbruik of verhoogt het hernieuwbare opwek?
SDG 8  — Werk: creëert de uitvoering van de maatregel lokale werkgelegenheid?
SDG 9  — Innovatie: introduceert de maatregel nieuwe of schone technologie in het gebouw?
SDG 10 — Ongelijkheid: maakt de maatregel energie of woonkwaliteit toegankelijker?
SDG 11 — Steden: verbetert de maatregel leefbaarheid, luchtkwaliteit of woningkwaliteit in de omgeving?
SDG 12 — Consumptie: vermindert de maatregel verspilling van energie of materialen?
SDG 13 — Klimaat: levert de maatregel een meetbare CO₂-reductie op?
SDG 14 — Water (zee): vermindert de maatregel lozingen of impact op waterlichamen?
SDG 15 — Land: heeft de maatregel geen negatieve impact op natuur of biodiversiteit?
SDG 16 — Vrede/instituties: voldoet de uitvoering aan transparante en eerlijke werkwijzen?
SDG 17 — Partnerschap: bevordert de maatregel samenwerking tussen eigenaar, adviseur en financier?

Leg per geselecteerde SDG concreet uit met cijfers uit het rapport (CO₂-ton, kWh, €, m³, %).
Neem alleen SDGs op waar de bijdrage écht aantoonbaar is — niet elk SDG past bij elke maatregel.

${sdgLijst}

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

  "bankscore": 74,
  "bankscore_oordeel": "Geschikt voor groene financiering",

  "bankscore_componenten": [
    {"l": "ESG-score (gewogen)", "v": "74 / 100"},
    {"l": "Bewijsniveau", "v": "Niveau 3 / 4"},
    {"l": "Datakwaliteit", "v": "Bron-rapport gevalideerd"},
    {"l": "Beleidsrisico energie", "v": "Laag · dalend"},
    {"l": "Klimaatrisico (fysiek)", "v": "Laag-middel"},
    {"l": "Rapportagegereedheid", "v": "Officieel"}
  ],

  "radar": [
    {"l": "Transitierisico", "v": 78},
    {"l": "Datakwaliteit", "v": 82},
    {"l": "Bewijsniveau", "v": 75},
    {"l": "Klimaatrisico", "v": 68},
    {"l": "Rapportage", "v": 88}
  ],

  "maatregelen": [
    {
      "nr": "M1",
      "naam": "naam maatregel exact uit het rapport",
      "capex": 9800,
      "bes": 760,
      "co2": 1.05,
      "tvt": 12.9,
      "subs": 1470,
      "label": "+1",
      "scope": "Scope 1",
      "omschrijving": "ESG-relevantie voor bankdossier",
      "sdg_koppelingen": [
        {
          "sdg_nr": "7",
          "uitleg": "Concrete uitleg met cijfers uit het rapport: bijv. 'Verlaagt energieverbruik met X kWh/jr door betere isolatiewaarde Rc X.'"
        },
        {
          "sdg_nr": "13",
          "uitleg": "Concrete uitleg: bijv. 'Bespaart X tCO₂ per jaar door reductie gasverbruik met X m³.'"
        },
        {
          "sdg_nr": "11",
          "uitleg": "Concrete uitleg: bijv. 'Verbetert binnenklimaat en thermisch comfort voor bewoners en gasten.'"
        },
        {
          "sdg_nr": "3",
          "uitleg": "Concrete uitleg: bijv. 'Betere isolatie vermindert tocht en vochtige muren, wat de luchtkwaliteit en gezondheid verbetert.'"
        }
      ]
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
          content: "Je bent een senior ESG/ESRS-bankadviseur. Je maakt een AANVULLEND bankdossier met ESRS-rapportage, SFDR-classificatie, EU Taxonomie-toets en ESG-financieringsadvies. BELANGRIJK: Bij sdg_koppelingen gebruik je UITSLUITEND de SDG-nummers die in de prompt zijn opgegeven (1-17). Loop voor elke maatregel alle 17 SDGs systematisch langs en neem alleen die op waarbij de bijdrage aantoonbaar is. Gebruik specifieke cijfers uit het rapport. Geef uitsluitend valide JSON terug, zonder markdown. Begin direct met { en eindig met }."
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
