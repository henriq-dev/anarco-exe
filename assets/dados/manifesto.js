/* Recursos SVG vetoriais locais para substituir somente os itens referenciados mas ausentes no ZIP. */
(() => {
  const svg = (content, width = 128, height = 128) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`)}`
  const icon = (glyph, color) => svg(`<circle cx="64" cy="64" r="50" fill="#080610" stroke="${color}" stroke-width="5"/><path d="${glyph}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`)
  window.ICON = {
    data: icon('M35 64h58M64 35v58M44 44l40 40M84 44 44 84', '#2fe6ff'),
    hack: icon('M35 54V43a29 29 0 0 1 58 0v11M30 54h68v45H30zM57 69v15', '#ff3fd0'),
    drone: icon('M64 37v54M37 64h54M46 46l36 36M82 46 46 82', '#ff8a00'),
    energy: icon('M72 22 42 68h20l-6 38 31-50H66z', '#ffe14a'),
    keycard: icon('M34 36h60v56H34zM45 50h24M45 61h38M45 72h30', '#39ff88'),
    usb: icon('M64 31v53m0-53-13 14m13-14 13 14m-13 39-17-13m17 13 17-13', '#2fe6ff'),
  }
  const panel = (title, accent, body) => svg(`<rect width="128" height="128" rx="9" fill="#0a1017" stroke="${accent}" stroke-width="5"/><path d="M11 30h106M18 45h92M18 59h58M18 73h82M18 87h47" stroke="${accent}" stroke-opacity=".8" stroke-width="4"/><text x="64" y="116" fill="#f1eee8" font-family="monospace" font-size="14" text-anchor="middle">${title}</text>${body}`)
  window.PR = {
    rack: { src: panel('RACK', '#2fe6ff', '<path d="M27 18h74" stroke="#39ff88" stroke-width="4"/>'), ar: 0.76 },
    crt: { src: panel('CAM // 07', '#39ff88', '<circle cx="101" cy="18" r="5" fill="#ff3fd0"/>'), ar: 0.94 },
    laptop: { src: panel('BREACH', '#ff3fd0', '<path d="M31 99h66" stroke="#ff3fd0" stroke-width="7"/>'), ar: 1.25 },
    usb: { src: icon('M64 24v56m0-56-14 14m14-14 14 14M51 80h26v20H51z', '#39ff88'), ar: 0.72 },
    mask: { src: svg('<path d="M20 44 64 25l44 19-8 44-36 18-36-18z" fill="#11131a" stroke="#53f6ff" stroke-width="6"/><path d="M36 59h19m18 0h19M56 78l8 7 8-7" fill="none" stroke="#ff3fd0" stroke-width="5" stroke-linecap="round"/>'), ar: 0.92 },
  }
  window.SCENE = svg('<defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#07150f"/><stop offset="1" stop-color="#11161c"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/><path d="M0 24h128M0 64h128M0 104h128M24 0v128M64 0v128M104 0v128" stroke="#39ff88" stroke-opacity=".19" stroke-width="2"/><path d="M12 90h31V52h22v31h30V40h20" fill="none" stroke="#2fe6ff" stroke-opacity=".72" stroke-width="4"/><circle cx="43" cy="52" r="4" fill="#ff3fd0"/><circle cx="95" cy="40" r="4" fill="#39ff88"/>')
})()
