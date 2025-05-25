<div className="mt-4 hidden lg:block">
  <div className='border-base-300 border-2 border-dashed rounded-xl p-5' ref={ref}>
    
    {/* En-tête clinique - flex row */}
    <div className="mb-5 flex items-center space-x-4">
      <img
        src="/sante.jpg"
        alt="Logo Clinique"
        crossOrigin="anonymous"
        className="w-16 h-16 object-contain" // Petite image bien proportionnée
      />
      <div>
        <h2 className="text-2xl font-bold">{clinique?.nom || "Nom de la Clinique"}</h2>
        <p>{clinique?.adresse}</p>
        <p>Téléphone : {clinique?.telephone}</p>
      </div>
    </div>

    <hr className="my-4" />

    <h3 className="text-xl font-semibold mb-3">Facture Patient</h3>
    <p><strong>Nom :</strong> {prenom} {nom}</p>
    <p><strong>Adresse :</strong> {adresse}</p>
    <p><strong>Date :</strong> {new Date(date).toLocaleString()}</p>

    <h4 className="mt-6 mb-2 font-semibold">Soins</h4>
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Soin</th>
            <th className="border border-gray-300 px-4 py-2 text-right">Prix (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          {soins.map((s, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border border-gray-300 px-4 py-2">{s.nom}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{s.prix.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p className="mt-4 text-right font-bold text-lg">
      Total : {soins.reduce((sum, soin) => sum + soin.prix, 0).toFixed(0)} FCFA
    </p>
  </div>
</div>