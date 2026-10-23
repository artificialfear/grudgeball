import re,base64,os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s=open('src/grudgeball.src.html').read()
mime={'png':'image/png','jpg':'image/jpeg','gif':'image/gif'}
def uri(n):
    for ext in mime:
        f=f'assets/{n}.{ext}'
        if os.path.exists(f): return f'data:{mime[ext]};base64,'+base64.b64encode(open(f,'rb').read()).decode()
    sys.exit('missing '+n)
# built-in question sets: every questions/*.txt file, in file-name order; the set name is the first '# Set:' line
import json, glob
sets={}
for f in sorted(glob.glob('questions/*.txt')):
    t=open(f,encoding='utf-8').read(); m=re.search(r'^# Set:\s*(.+)$',t,re.M)
    sets[(m.group(1) if m else os.path.splitext(os.path.basename(f))[0]).strip()]=t
s=s.replace('__BUILTIN_SETS__', json.dumps(sets, ensure_ascii=False).replace('</','<\\/'))
# inline local scripts (VexFlow for staff notation, the music question generator)
def inline(m):
    js=open(m.group(1),encoding='utf-8').read()
    if '</script' in js.lower(): sys.exit('script contains </script: '+m.group(1))
    return '<script>\n'+js+'\n</script>'
s=re.sub(r'<!--INLINE:([\w/.\-]+)-->',inline,s)
# sound files keep their names when replaced, so tag each with a content hash: browsers fetch the new one
import hashlib
sver={os.path.splitext(os.path.basename(p))[0]: hashlib.md5(open(p,'rb').read()).hexdigest()[:8] for p in sorted(glob.glob('sounds/*.mp3'))}
s=s.replace('__SOUND_VER__', json.dumps(sver))
out=re.sub(r'__A_(\w+?)__',lambda m:uri(m.group(1)),s)
open('index.html','w').write(out); print(len(out)//1024,'KB')
