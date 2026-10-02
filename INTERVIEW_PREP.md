# Ten likely interviewer questions

1. **Why AI at all?** To turn structured rule output into concise, localized language; source calculations and interpretations remain outside the LLM.
2. **Why astrology?** It supplies date-changing inputs and explicit rule boundaries for the design; it is not asserted as scientific prediction.
3. **Why not prompt an LLM for a horoscope?** That hides sources, rules and failure points, making grounding and reproducibility hard to check.
4. **What makes this different from CHANI?** CHANI already has journaling and reflection. Our hypothesis is a compact daily sequence linking source explanation, one action and same-day feedback; test it with users.
5. **How personal is the POC?** Guest is general; registered date-only mode supports approximate Sun-sign interpretation, not full natal-chart claims.
6. **How do you handle uncertain birth dates near sign boundaries?** Calculate only to available precision or fall back to general guidance with clear labeling.
7. **What if the LLM fails?** Validate, retry once, then use an approved static narrative based on the same structured context.
8. **What if sky calculations fail?** Use a verified cached result when available or show temporary unavailability; never invent positions.
9. **Why store readings and feedback?** Readings give daily consistency and history; optional ratings support user reflection and quality evaluation. Guests need no persistent history.
10. **How would you judge success?** Repeated completed readings and explicit usefulness, constrained by safety, reliability, grounding and cost; set targets after a baseline pilot.
