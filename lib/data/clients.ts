/* ==========================================================================
   Lista canónica de clientes — usada por ClientsMarquee (home y capacity).
   --------------------------------------------------------------------------
   En home rota un spotlight aleatorio sobre toda la lista. En capacity se
   resaltan estáticamente los clientes específicos de cada servicio (los
   demás quedan en text-fg/10), reusando el mismo layout justificado.

   Orden ajustado del original con swaps mínimos de igual-longitud para
   que los destacados de cada servicio caigan repartidos y mid-line:

   · Pensamiento (5):  pos  6, 16, 18, 30, 39 — posiciones originales
   · Experiencias (6): pos  3, 11, 15, 24, 33, 37
   · Transformación (4): pos 9, 17, 26, 31 — Adeslas hacia dentro y abajo
     (línea 5 mid en lugar de línea 1 far-left)
   ========================================================================== */
export const CLIENTS = [
  'Mango',
  'AD Parts',
  'Tecnocasa',
  'AXA',
  'Banc Sabadell',
  'Bershka',
  'Brico Depot',
  'Bytetravel',
  'Novartis',
  'CaixaBank',
  'CatSalut',
  'Citring',
  'Consentio',
  'Desigual',
  'ING',
  'Ecoembes',
  'MWC',
  'Frit Ravich',
  'EAE',
  'Gescaser',
  'GLS',
  'Grandvalira',
  'Grupo Piñero',
  'Imagin',
  'Hermex',
  'Nestlé',
  'Inditex',
  'FCB',
  'La Wash',
  'Mahou',
  'Adeslas',
  'Masmusculo',
  'Massimo Dutti',
  'Ignion',
  'Castañer',
  'Quepo',
  'Ricoh',
  'Hospital Sant Pau',
  'Serveo',
  'Allianz',
  'Telefónica',
  'UPF ESCI',
  'Vibia',
  'Voicemod',
  'Voro',
] as const
