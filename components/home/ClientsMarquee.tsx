const CLIENTS = [
  'AD Parts', 'Adeslas', 'Allianz', 'AXA', 'Banc Sabadell', 'Bershka', 'Brico Depot',
  'Bytetravel', 'CaixaBank', 'Castañer', 'CatSalut', 'Citring', 'Consentio',
  'Desigual', 'EAE', 'Ecoembes', 'MWC', 'Frit Ravich', 'FCB', 'Gescaser',
  'GLS', 'Grandvalira', 'Grupo Piñero', 'Hermex', 'Ignion', 'Imagin',
  'Inditex', 'ING', 'La Wash', 'Mahou', 'Mango', 'Masmusculo', 'Massimo Dutti',
  'Nestlé', 'Novartis', 'Quepo', 'Ricoh', 'Hospital Sant Pau', 'Serveo',
  'Tecnocasa', 'Telefónica', 'UPF ESCI', 'Vibia', 'Voicemod', 'Voro',
]

export function ClientsMarquee() {
  return (
    <section
      aria-hidden="true"
      className="relative z-content w-full bg-bg py-16"
    >
      <div className="section-inner">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {CLIENTS.map((client) => (
            <span
              key={client}
              className="font-serif font-normal text-fg/20 text-title"
            >
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
