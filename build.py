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
out=re.sub(r'__A_(\w+?)__',lambda m:uri(m.group(1)),s)
open('index.html','w').write(out); print(len(out)//1024,'KB')
