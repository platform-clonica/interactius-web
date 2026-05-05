/* ==========================================================================
   Lista canónica de clientes — usada por ClientsMarquee (home y capacity).
   --------------------------------------------------------------------------
   Orden diseñado para que los destacados de cada servicio queden bien
   repartidos en el listado, evitando clusters:

   · Pensamiento (5):    posiciones  4, 13, 22, 31, 41 — spacing ≈9
   · Experiencias (6):   posiciones  3, 10, 17, 25, 32, 40 — spacing ≈7-8
   · Transformación (4): posiciones  6, 18, 29, 39 — spacing ≈10-12

   Ningún cliente pertenece a más de un servicio; los demás son filler que
   queda en text-fg/10.
   ========================================================================== */
export const CLIENTS = [
  'Mango',           //  0
  'AD Parts',        //  1
  'AXA',             //  2
  'Tecnocasa',       //  3  — Experiencias
  'Bershka',         //  4  — Pensamiento
  'Banc Sabadell',   //  5
  'Novartis',        //  6  — Transformación
  'Brico Depot',     //  7
  'Bytetravel',      //  8
  'CaixaBank',       //  9
  'CatSalut',        // 10  — Experiencias
  'Citring',         // 11
  'Consentio',       // 12
  'Ecoembes',        // 13  — Pensamiento
  'Desigual',        // 14
  'EAE',             // 15
  'Gescaser',        // 16
  'ING',             // 17  — Experiencias
  'MWC',             // 18  — Transformación
  'GLS',             // 19
  'Grandvalira',     // 20
  'Grupo Piñero',    // 21
  'Mahou',           // 22  — Pensamiento
  'Hermex',          // 23
  'Inditex',         // 24
  'Imagin',          // 25  — Experiencias
  'FCB',             // 26
  'La Wash',         // 27
  'Masmusculo',      // 28
  'Nestlé',          // 29  — Transformación
  'Ignion',          // 30
  'Frit Ravich',     // 31  — Pensamiento
  'Massimo Dutti',   // 32  — Experiencias
  'Castañer',        // 33
  'Quepo',           // 34
  'Hospital Sant Pau', // 35
  'Allianz',         // 36
  'Telefónica',      // 37
  'UPF ESCI',        // 38
  'Adeslas',         // 39  — Transformación
  'Ricoh',           // 40  — Experiencias
  'Serveo',          // 41  — Pensamiento
  'Vibia',           // 42
  'Voicemod',        // 43
  'Voro',            // 44
] as const
