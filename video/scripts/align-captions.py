import json,re,difflib,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
heard=json.loads((root/'video/public/captions.json').read_text())
# Keep punctuation on words; the local recognizer supplies their measured times.
raw=[]
for c in heard:
 for w in c['text'].split():raw.append({'text':w,'start':c['startMs'],'end':c['endMs']})
script=(root/'docs/video/VOICEOVER.md').read_text().split('## Script\n\n')[1].split('\n## Planned edit')[0]
words=script.split()
norm=lambda w:re.sub(r'[^a-z0-9]','',w.lower())
matcher=difflib.SequenceMatcher(a=[norm(x['text']) for x in raw],b=[norm(w) for w in words],autojunk=False)
aligned=[]
for op,a,b,c,d in matcher.get_opcodes():
 if op=='equal':
  aligned.extend({'text':words[j],'start':raw[a+j-c]['start'],'end':raw[a+j-c]['end']} for j in range(c,d))
 elif d>c:
  start=raw[a]['start'] if a<len(raw) else raw[-1]['end']
  end=raw[b-1]['end'] if b>a else (raw[a]['start'] if a<len(raw) else raw[-1]['end'])
  if end<=start:end=start+max(80,(d-c)*110)
  for j in range(c,d):aligned.append({'text':words[j],'start':start+(j-c)/(d-c)*(end-start),'end':start+(j-c+1)/(d-c)*(end-start)})
# Sentence/phrase captions, offset by the two-second branded opening.
pages=[];group=[]
for w in aligned:
 group.append(w)
 if len(group)>=10 or (len(group)>=4 and w['text'].endswith(('.', '?', '!'))):
  pages.append(group);group=[]
if group:pages.append(group)
result=[]
for i,g in enumerate(pages):
 start=round(g[0]['start']+2000);end=round(g[-1]['end']+2000)
 if i+1<len(pages):end=min(max(end,start+100),round(pages[i+1][0]['start']+2000))
 result.append({'text':' '.join(w['text'] for w in g),'startMs':start,'endMs':max(start+80,end),'timestampMs':None,'confidence':None})
(root/'video/src/captions.json').write_text(json.dumps(result,indent=2)+'\n')
(root/'video/public/captions-aligned.json').write_text(json.dumps(result,indent=2)+'\n')
print('Aligned',len(words),'script words into',len(result),'caption phrases.')
