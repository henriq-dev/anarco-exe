"""ÂNCORA: reduz o peso dos .glb recomprimindo só as TEXTURAS embutidas (a malha e os ossos não mudam).
Uso: python3 scripts/reduzir-glb.py entrada.glb saida.glb   (precisa de Pillow)"""
import json, struct, io, sys
from PIL import Image

def reduzir(src, dst, lado_png=1536, lado_jpg=1024, q=80):
    d = open(src, 'rb').read()
    n = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + n])
    ini = 20 + n + 8                     # início do bloco binário
    binario = d[ini:ini + struct.unpack('<I', d[20 + n:24 + n])[0]]
    novo = {}                            # índice do bufferView -> bytes novos
    for img in j['images']:
        i = img['bufferView']; v = j['bufferViews'][i]
        bruto = binario[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        im = Image.open(io.BytesIO(bruto)); png = img['mimeType'] == 'image/png'
        lado = lado_png if png else lado_jpg
        if max(im.size) > lado: im = im.resize((lado, lado), Image.LANCZOS)
        out = io.BytesIO()
        im.save(out, 'PNG', optimize=True) if png else im.convert('RGB').save(out, 'JPEG', quality=q, optimize=True)
        novo[i] = out.getvalue()
    # remonta o binário, realinhando cada bufferView em múltiplos de 4 bytes
    partes, pos = [], 0
    for i, v in enumerate(j['bufferViews']):
        dados = novo.get(i, binario[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']])
        v['byteOffset'], v['byteLength'] = pos, len(dados)
        pad = (-len(dados)) % 4
        partes.append(dados + b'\0' * pad); pos += len(dados) + pad
    corpo = b''.join(partes)
    j['buffers'][0]['byteLength'] = len(corpo)
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    total = 12 + 8 + len(js) + 8 + len(corpo)
    open(dst, 'wb').write(b'glTF' + struct.pack('<II', 2, total) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(corpo)) + b'BIN\0' + corpo)

if __name__ == '__main__':
    reduzir(sys.argv[1], sys.argv[2])
