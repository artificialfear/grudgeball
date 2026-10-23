import re,base64,os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s=open('src/grudgeball.src.html').read()
mime={'png':'image/png','jpg':'image/jpeg','gif':'image/gif'}
def uri(n):
    for ext in mime:
        f=f'assets/{n}.{ext}'
        if os.path.exists(f): return f'data:{mime[ext]};base64,'+base64.b64encode(open(f,'rb').read()).decode()
    sys.exit('missing '+n)
out=re.sub(r'__A_(\w+?)__',lambda m:uri(m.group(1)),s)
open('index.html','w').write(out); print(len(out)//1024,'KB')
