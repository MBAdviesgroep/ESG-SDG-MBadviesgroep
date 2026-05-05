import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

    const prompt = `Je bent een ESG/ESRS-expert. Analyseer onderstaande tekst uit een verduurzamingsrapport.
Bereken Scope 1 CO₂ uit gasverbruik: factor 1.785 kg CO₂/m³.
Bereken Scope 2 CO₂ uit netto netafname: factor 0.42 kg CO₂/kWh (netto = totaal elektra minus zelfopwekking).
Retourneer ALLEEN valide JSON, geen markdown, geen uitleg.

Schema:
{
  "object_naam": "string",
  "object_adres": "string",
  "bron_tool": "string (naam bank/tool)",
  "huidig_label": "string",
  "streef_label": "string",
  "samenvatting": "string (2 professionele zinnen)",
  "huidige_energiekosten": "string (€ X.XXX)",
  "besparing_jaar": "string (€ X.XXX)",
  "co2_reductie_pct": "string (bijv. 35%)",
  "tvt": "string (bijv. 13 jaar)",
  "scope1_co2": "string (bijv. ~10,6 tCO₂e/jr)",
  "scope2_co2": "string (bijv. ~0,8 tCO₂e/jr)",
  "credion_score_nu": "string (A/B/C/D)",
  "credion_score_na": "string (A/B/C/D)",
  "esrs_velden": [
    {
      "veld": "string (Engelstalige ESRS-veldnaam)",
      "code": "string (bijv. E1-6 · par. 48a)",
      "waarde": "string (waarde + eenheid)",
      "bron": "string (korte bronverwijzing naar rapport)",
      "regelgeving": ["SFDR"],
      "status": "gevuld | indicatief | ontbreekt"
    }
  ],
  "sdg_onderbouwing": [
    {
      "sdg_nr": "string (bijv. SDG 7)",
      "sdg_naam": "string",
      "maatregel": "string",
      "bewijs": "string (concreet getal of feit)",
      "status": "ok | kwalitatief | ontbreekt"
    }
  ],
  "gaps": [
    {
      "titel": "string",
      "omschrijving": "string",
      "ernst": "waarschuwing | ontbreekt"
    }
  ],
  "compl_scope12": number,
  "compl_energie": number,
  "compl_sdg": number,
  "compl_scope3": number,
  "compl_governance": number
}

Vul minimaal 6 esrs_velden en 4 sdg_onderbouwing in. compl_* zijn percentages (0-100).

RAPPORTTEKST:
${pdfText.substring(0, 14000)}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const raw = response.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return res.status(500).json({
        error: "De AI gaf geen geldige JSON terug",
        raw
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
