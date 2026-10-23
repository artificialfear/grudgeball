import numpy as np
from PIL import Image, ImageFilter
SRC={'shield':'olf/images/shield cropped.png','ring':'olf/images/ring cropped.png','sword':'olf/images/sword cropped.png','reed':'olf/images/reed cropped.png'}
GLOW={'shield':(90,170,255),'ring':(255,90,70),'sword':(185,80,255),'reed':(255,200,90)}

def straighten(im, window=81):
    a=np.array(im); al=a[:,:,3]; H,W=al.shape
    cen=np.full(H,np.nan)
    for y in range(H):
        xs=np.nonzero(al[y]>60)[0]
        if len(xs): cen[y]=(xs.min()+xs.max())/2
    ok=~np.isnan(cen); idx=np.arange(H)
    cen=np.interp(idx, idx[ok], cen[ok])
    k=np.ones(window)/window; pad=window//2
    sm=np.convolve(np.pad(cen,pad,mode='edge'),k,mode='valid')
    target=W/2
    out=np.zeros_like(a)
    for y in range(H):
        s=int(round(target-sm[y])); out[y]=np.roll(a[y],s,axis=0)
        if s>0: out[y,:s]=0
        elif s<0: out[y,s:]=0
    return Image.fromarray(out)

def mirror_left(im):
    a=np.array(im); W=a.shape[1]; h=W//2
    a[:,W-h:]=a[:,:h][:,::-1]
    return Image.fromarray(a)

def glow(im, color, radius_frac=0.035, strength=0.75):
    W,H=im.size; r=max(4,int(max(W,H)*radius_frac)); pad=r*3
    canvas=Image.new('RGBA',(W+2*pad,H+2*pad),(0,0,0,0)); canvas.paste(im,(pad,pad),im)
    al=canvas.split()[3].point(lambda v:255 if v>40 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(r))
    al=al.point(lambda v:int(v*strength))
    g=Image.new('RGBA',canvas.size,color+(0,)); g.putalpha(al)
    out=Image.alpha_composite(g,canvas); return out.crop(out.getbbox())

res={}
for n,src in SRC.items():
    im=Image.open(src).convert('RGBA'); im=im.crop(im.getbbox())
    if n in ('reed','sword'):
        # remove the old soft pink halo baked into the art so only the new glow shows
        a=np.array(im); a[a[:,:,3]<235]=0; im=Image.fromarray(a); im=im.crop(im.getbbox())
    if n in('sword','reed'): im=straighten(im)
    if n=='sword': im=mirror_left(im)
    im=im.crop(im.getbbox())
    g=glow(im,GLOW[n])
    res[n]=g
    small=g.copy(); small.thumbnail((180,180),Image.LANCZOS); small.save(f'assets_new_ic_{n}.png',optimize=True)
# before/after preview, large
prev=Image.new('RGBA',(1700,900),(30,14,24,255))
for i,n in enumerate(['shield','ring','sword','reed']):
    b=Image.open(SRC[n]).convert('RGBA'); b.thumbnail((380,380)); prev.paste(b,(i*420+20,20),b)
    a=res[n].copy(); a.thumbnail((400,440)); prev.paste(a,(i*420+10,440),a)
prev.save('test/icons_compare.png')
# straightness check
for n in ('sword','reed'):
    a=np.array(res[n])[:,:,3]; cs=[]
    for y in range(0,a.shape[0],max(1,a.shape[0]//20)):
        xs=np.nonzero(a[y]>200)[0]
        if len(xs): cs.append(round((xs.min()+xs.max())/2-a.shape[1]/2,1))
    print(n,'centre offsets (px):',cs)
