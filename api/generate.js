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

    // Stuur maximaal 12.000 tekens — grote PDFs veroorzaken token-overflow
    const rapportTekst = pdfText.substring(0, 12000);

    const prompt = `Je bent een senior ESG/ESRS-adviseur bij een gespecialiseerd financierings- en vastgoedadviesbureau. 
Analyseer onderstaand verduurzamingsrapport grondig en genereer een uitgebreide, professionele ESG/SDG-rapportage.

═══════════════════════════════════════════════
BEREKENINGSREGELS — verplicht toepassen
═══════════════════════════════════════════════
• Scope 1 CO₂ uit aardgas: verbruik_m3 × 1.785 kg CO₂/m³ ÷ 1000 = tCO₂e/jr
• Scope 1 CO₂ uit stadsverwarming: energieverbruik_GJ × 0.067 tCO₂e/GJ
• Scope 2 CO₂ (locatie-gebaseerd): netto_netafname_kWh × 0.420 kg CO₂/kWh ÷ 1000 = tCO₂e/jr
  waarbij netto_netafname = totaal_elektra - eigen_opwekking_zonnepanelen
• Scope 2 CO₂ (markt-gebaseerd): gebruik 0 als groene stroom wordt ingekocht, anders zelfde als locatie
• Energielabel omzetting naar EPA-index: G=400, F=340, E=280, D=220, C=160, B=100, A=50, A+=25, A++=10, A+++=0
• Totale CO₂-reductie na maatregelen = scope1_reductie + scope2_reductie (absoluut in tCO₂e/jr)
• CO₂-reductiepercentage = (totale_reductie / scope1_huidig + scope2_huidig) × 100

═══════════════════════════════════════════════
VOLLEDIGHEIDSSCORES — richtlijnen
═══════════════════════════════════════════════
• compl_scope12: 100% als zowel S1 als S2 exact berekend zijn met werkelijke verbruikscijfers; 
  75% als indicatief gasverbruik; 50% als geschat
• compl_energie: 100% als gas + elektra + hernieuwbaar allemaal aanwezig; anders proportioneel
• compl_sdg: tel onderbouwde SDGs (ok of kwalitatief) / 6 × 100
• compl_scope3: 0% standaard voor gebouwscan; 30% als leveranciersketen benoemd; 
  60% als ketenanalyse aanwezig
• compl_governance: 0% standaard; 50% als bestuursinformatie aanwezig; 100% als diversiteitsdata aanwezig
• compl_maatregelen: 100% als alle maatregelen volledig omschreven met CO₂ data; anders proportioneel

═══════════════════════════════════════════════
CREDION ESG-SCORE RICHTLIJNEN
═══════════════════════════════════════════════
Huidige score (voor maatregelen):
• A: energielabel A of beter + actief duurzaamheidsbeleid + scope 1+2 gerapporteerd
• B: energielabel B-C + basismaatregelen genomen + enige ESG-rapportage
• C: energielabel D-E + beperkte maatregelen + weinig/geen ESG-rapportage
• D: energielabel F-G + geen maatregelen + geen ESG-rapportage

Score na maatregelen: baseer op streeflabel + volledigheid rapportage + CO₂-reductie

Retourneer UITSLUITEND valide JSON — geen markdown, geen uitleg, geen prefix of suffix.

{
  "object_naam": "string — officiële naam van het pand/complex",
  "object_adres": "string — volledig adres inclusief postcode en plaats",
  "bron_tool": "string — exacte naam van de bank/tool die de scan genereerde",
  "datum_rapport": "string — datum van het rapport of analyseperiode",
  "huidig_label": "string — huidige energielabelklasse (G t/m A+++)",
  "streef_label": "string — beoogd energielabel na alle maatregelen",
  "functie": "string — gebruiksfunctie (woning, kantoor, horeca, recreatie, etc.)",
  "bouwjaar": "string — bouwjaar of bouwperiode",
  "oppervlakte": "string — bruto/netto vloeroppervlak in m²",
  "samenvatting": "string — 3-4 professionele zinnen",
  "huidige_energiekosten": "string — € X.XXX per jaar",
  "besparing_jaar": "string — € X.XXX per jaar na alle maatregelen",
  "totaal_investering": "string — totale investeringskosten bruto",
  "netto_investering": "string — netto investering na subsidies",
  "gemiddelde_tvt": "string — gewogen gemiddelde terugverdientijd",
  "co2_reductie_pct": "string — percentage CO₂-reductie",
  "co2_reductie_abs": "string — absolute CO₂-reductie in tCO₂e/jr",
  "gasverbruik_m3": "string",
  "elektra_kwh": "string",
  "zelfopwekking_kwh": "string",
  "netto_netafname_kwh": "string",
  "hernieuwbaar_pct": "string",
  "hernieuwbaar_pct_na": "string",
  "scope1_co2": "string",
  "scope2_co2_locatie": "string",
  "scope2_co2_markt": "string",
  "scope1_co2_na": "string",
  "scope2_co2_na": "string",
  "totaal_co2_huidig": "string",
  "totaal_co2_na": "string",
  "credion_score_nu": "string — A/B/C/D met korte motivering",
  "credion_score_na": "string — A/B/C/D met korte motivering",
  "compl_scope12": 85,
  "compl_energie": 80,
  "compl_sdg": 70,
  "compl_scope3": 25,
  "compl_governance": 20,
  "compl_maatregelen": 90,
  "maatregelen": [
    {
      "naam": "string",
      "categorie": "string",
      "fase": "string",
      "prioriteit": "hoog | middel | laag",
      "besparing_jr": "string",
      "investering": "string",
      "tvt": "string",
      "co2_reductie": "string",
      "scope": "string",
      "subsidies": "string",
      "omschrijving": "string",
      "aandachtspunt": null
    }
  ],
  "esrs_velden": [
    {
      "categorie": "E | S | G",
      "standaard": "string",
      "veld": "string",
      "code": "string",
      "waarde": "string",
      "waarde_na": "string",
      "bron": "string",
      "regelgeving": ["SFDR"],
      "verplicht_per": "string",
      "status": "gevuld | indicatief | ontbreekt",
      "toelichting": "string"
    }
  ],
  "sdg_onderbouwing": [
    {
      "sdg_nr": "string",
      "sdg_naam": "string",
      "sdg_icoon_kleur": "string",
      "relevantie": "hoog | middel | laag",
      "maatregel": "string",
      "bewijs": "string",
      "doelstelling_2030": "string",
      "status": "ok | kwalitatief | ontbreekt",
      "toelichting": "string"
    }
  ],
  "gaps": [
    {
      "categorie": "string",
      "titel": "string",
      "omschrijving": "string",
      "actie": "string",
      "tijdlijn": "string",
      "ernst": "waarschuwing | ontbreekt | kritiek"
    }
  ],
  "subsidie_overzicht": [
    {
      "code": "string",
      "naam": "string",
      "type": "string",
      "bedrag": "string",
      "van_toepassing_op": "string",
      "actie_vereist": "string",
      "deadline": null
    }
  ],
  "financieringsadvies": {
    "aanbevolen_structuur": "string",
    "bmkb_groen": false,
    "eigen_inbreng_aanbevolen": "string",
    "looptijd_aanbevolen": "string",
    "maandlast_schatting": "string"
  },
  "risicosignalering": [
    {
      "risico": "string",
      "categorie": "string",
      "kans": "laag | middel | hoog",
      "impact": "laag | middel | hoog",
      "mitigatie": "string"
    }
  ],
  "stappenplan": [
    {
      "stap": 1,
      "titel": "string",
      "omschrijving": "string",
      "tijdlijn": "string",
      "actoren": "string",
      "resultaat": "string"
    }
  ]
}

VEREISTEN:
• Minimaal 10 esrs_velden (mix E, S, G)
• Minimaal 6 sdg_onderbouwing entries
• Minimaal 4 gaps
• Minimaal 4 maatregelen
• Minimaal 3 risicosignaleringen
• Minimaal 5 stappen in het stappenplan
• Bereken scope1_co2 en scope2_co2 zelf op basis van energiedata
• Gebruik Nederlandse taal voor alle tekstuele velden
• Gebruik exacte getallen uit het rapport

RAPPORTTEKST:
${rapportTekst}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Je bent een senior ESG/ESRS-adviseur. Je geeft uitsluitend valide JSON terug, zonder markdown, zonder uitleg, zonder enige tekst buiten de JSON. Begin direct met { en eindig met }."
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
      console.error("JSON parse error. Raw (eerste 1000 tekens):", raw.substring(0, 1000));
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
