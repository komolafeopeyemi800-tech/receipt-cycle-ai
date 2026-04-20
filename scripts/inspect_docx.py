import zipfile, xml.etree.ElementTree as ET, re, pathlib
p = r'c:\Users\zenit\Downloads\ReceiptCycle_5_Content_Articles (1).docx'
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(p) as z:
    root = ET.fromstring(z.read('word/document.xml'))
paras=[]
for para in root.findall('.//w:body/w:p', ns):
    texts=[]
    for t in para.findall('.//w:t', ns):
        if t.text: texts.append(t.text)
    line=''.join(texts).strip()
    if line: paras.append(re.sub(r'\s+',' ',line))
# find markers
markers=[(i,l) for i,l in enumerate(paras) if re.fullmatch(r'#\d+', l)]
print('markers:', markers)
for (i,m), (j,n) in zip(markers, markers[1:]+[(len(paras), None)]):
    title = paras[i+1] if i+1 < len(paras) else ''
    end = j if n is None else j
    body = paras[i+2:end]
    print('\n==', m, 'title:', title, 'paras:', len(body))
