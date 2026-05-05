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
  "samenvatting": "string — 3-4 professionele zinnen die het object, huidige situatie, verduurzamingsopgave en ESG-relevantie beschrijven",
  
  "huidige_energiekosten": "string — € X.XXX per jaar",
  "besparing_jaar": "string — € X.XXX per jaar na alle maatregelen",
  "besparing_25jaar": "string — cumulatieve besparing over 25 jaar bij 3% energieprijsstijging (€ XXX.XXX)",
  "totaal_investering": "string — totale investeringskosten bruto",
  "netto_investering": "string — netto investering na subsidies en fiscale voordelen",
  "gemiddelde_tvt": "string — gewogen gemiddelde terugverdientijd",
  "co2_reductie_pct": "string — percentage CO₂-reductie na maatregelen (bijv. 35%)",
  "co2_reductie_abs": "string — absolute CO₂-reductie in tCO₂e/jr (bijv. 4,2 tCO₂e/jr)",
  
  "gasverbruik_m3": "string — gasverbruik in m³/jr of 'niet van toepassing'",
  "elektra_kwh": "string — elektraverbruik in kWh/jr",
  "zelfopwekking_kwh": "string — eigen opwekking zonnepanelen in kWh/jr",
  "netto_netafname_kwh": "string — netto netafname (elektra - zelfopwekking) in kWh/jr",
  "hernieuwbaar_pct": "string — percentage energie uit hernieuwbare bronnen (nu, vóór maatregelen)",
  "hernieuwbaar_pct_na": "string — percentage energie uit hernieuwbare bronnen (na maatregelen)",
  
  "scope1_co2": "string — Scope 1 bruto emissies huidig (bijv. ~10,6 tCO₂e/jr) met berekeningswijze",
  "scope2_co2_locatie": "string — Scope 2 locatie-gebaseerd huidig (bijv. ~0,8 tCO₂e/jr)",
  "scope2_co2_markt": "string — Scope 2 markt-gebaseerd huidig",
  "scope1_co2_na": "string — Scope 1 na maatregelen",
  "scope2_co2_na": "string — Scope 2 na maatregelen",
  "totaal_co2_huidig": "string — totaal Scope 1+2 huidig in tCO₂e/jr",
  "totaal_co2_na": "string — totaal Scope 1+2 na maatregelen in tCO₂e/jr",
  
  "credion_score_nu": "string — A, B, C of D met korte motivering (1 zin)",
  "credion_score_na": "string — A, B, C of D met korte motivering (1 zin)",
  
  "maatregelen": [
    {
      "naam": "string — naam van de maatregel",
      "categorie": "string — isolatie | installatie | opwekking | gedrag | monitoring",
      "fase": "string — Fase 1 / Fase 2 / Fase 3 / etc.",
      "prioriteit": "string — hoog | middel | laag (op basis van TVT)",
      "besparing_jr": "string — € X.XXX per jaar",
      "investering": "string — € X.XXX eenmalig",
      "tvt": "string — X,X jaar",
      "co2_reductie": "string — X,X tCO₂e/jr of 'nader te bepalen'",
      "scope": "string — Scope 1 | Scope 2 | Scope 1+2",
      "subsidies": "string — van toepassing zijnde subsidies (ISDE, EIA, KIA, etc.)",
      "omschrijving": "string — 2-3 zinnen over maatregel, relevantie voor dit pand en verwacht resultaat",
      "aandachtspunt": "string of null — eventuele specifieke aandachtspunten voor dit pand"
    }
  ],
  
  "esrs_velden": [
    {
      "categorie": "string — E (Environment) | S (Social) | G (Governance)",
      "standaard": "string — bijv. ESRS E1 | ESRS E5 | ESRS 2",
      "veld": "string — volledige Engelstalige ESRS-veldnaam",
      "code": "string — bijv. E1-6 · par. 48a of E1-5 · par. 37a",
      "waarde": "string — ingevulde waarde met eenheid, of '—' als niet beschikbaar",
      "waarde_na": "string of null — verwachte waarde na maatregelen",
      "eenheid": "string — tCO₂e/jr | kWh/jr | m³/jr | % | € | ja/nee",
      "bron": "string — exacte verwijzing naar waar dit in het rapport staat",
      "regelgeving": ["SFDR", "CSRD", "Pillar 3", "Benchmark"],
      "verplicht_per": "string — bijv. 2025 | 2026 | optioneel",
      "status": "gevuld | indicatief | ontbreekt",
      "toelichting": "string — 1 zin uitleg over wat dit veld betekent en hoe het is bepaald of waarom het ontbreekt"
    }
  ],
  
  "sdg_onderbouwing": [
    {
      "sdg_nr": "string — bijv. SDG 7",
      "sdg_naam": "string — Nederlandse naam van het SDG",
      "sdg_icoon_kleur": "string — hex kleurcode van het officiële SDG-icoontje",
      "relevantie": "string — hoog | middel | laag",
      "maatregel": "string — welke concrete maatregel(en) uit het rapport bijdragen",
      "bewijs": "string — concreet kwantitatief bewijs (getal, percentage, bedrag)",
      "doelstelling_2030": "string — hoe dit bijdraagt aan de Nederlandse 2030-doelstelling voor dit SDG",
      "status": "ok | kwalitatief | ontbreekt",
      "toelichting": "string — 2 zinnen over de relatie tussen de maatregelen en dit SDG"
    }
  ],
  
  "gaps": [
    {
      "categorie": "string — Emissies | Energie | Sociaal | Governance | Keten | Financieel | Juridisch",
      "titel": "string — korte omschrijving",
      "omschrijving": "string — 2-3 zinnen over wat ontbreekt, waarom het relevant is voor bankrapportage, en hoe het aangevuld kan worden",
      "actie": "string — concrete vervolgstap om dit gap te dichten",
      "tijdlijn": "string — bijv. 'binnen 3 maanden' | 'bij eerste meting' | 'jaarlijks'",
      "ernst": "waarschuwing | ontbreekt | kritiek"
    }
  ],
  
  "subsidie_overzicht": [
    {
      "code": "string — bijv. ISDE",
      "naam": "string — volledige naam",
      "type": "string — directe subsidie | fiscale aftrek | financieringsgarantie",
      "bedrag": "string — geschat subsidiebedrag of voordeel in €",
      "van_toepassing_op": "string — voor welke maatregelen",
      "actie_vereist": "string — concrete actie die vóór offerte moet plaatsvinden",
      "deadline": "string of null — uiterste aanvraagdatum of openstellingsronde"
    }
  ],
  
  "financieringsadvies": {
    "aanbevolen_structuur": "string — 2-3 zinnen over aanbevolen financieringsstructuur",
    "bmkb_groen": "boolean — of BMKB-Groen van toepassing is",
    "eigen_inbreng_aanbevolen": "string — aanbevolen eigen inbreng als percentage",
    "looptijd_aanbevolen": "string — aanbevolen looptijd lening",
    "maandlast_schatting": "string — geschatte totale maandlast (energie + aflossing) na verduurzaming"
  },
  
  "risicosignalering": [
    {
      "risico": "string — omschrijving van het risico",
      "categorie": "string — regulatoir | financieel | technisch | klimaat | reputatie",
      "kans": "string — laag | middel | hoog",
      "impact": "string — laag | middel | hoog",
      "mitigatie": "string — hoe dit risico te beperken"
    }
  ],
  
  "stappenplan": [
    {
      "stap": number,
      "titel": "string",
      "omschrijving": "string",
      "tijdlijn": "string — bijv. 'Maand 1-2'",
      "actoren": "string — wie moet actie ondernemen",
      "resultaat": "string — concreet resultaat van deze stap"
    }
  ],
  
  "compl_scope12": number,
  "compl_energie": number,
  "compl_sdg": number,
  "compl_scope3": number,
  "compl_governance": number,
  "compl_maatregelen": number
}
 
VEREISTEN:
• Minimaal 10 esrs_velden (mix van E, S en G categorieën)
• Minimaal 6 sdg_onderbouwing entries
• Minimaal 4 gaps
• Minimaal 4 maatregelen (alle maatregelen uit het rapport)
• Minimaal 3 risicosignaleringen
• Minimaal 5 stappen in het stappenplan
• Bereken altijd scope1_co2 en scope2_co2 zelf op basis van energiedata in het rapport
• Gebruik Nederlandse taal voor alle tekstuele velden
• Wees specifiek: gebruik exacte getallen uit het rapport, geen vage omschrijvingen
 
RAPPORTTEKST:
${pdfText.substring(0, 16000)}`;
 
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 4000,
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
    } catch {
      return res.status(500).json({
        error: "De AI gaf geen geldige JSON terug",
        raw: raw.substring(0, 500)
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
