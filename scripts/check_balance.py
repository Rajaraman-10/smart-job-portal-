from pathlib import Path
s=Path('frontend/src/App.js').read_text(encoding='utf-8')
paren=0
brace=0
brack=0
frag_open=0
frag_close=0
line=1
for i,ch in enumerate(s):
    if ch=='\n':
        line+=1
    if ch=='(':
        paren+=1
    elif ch==')':
        paren-=1
    elif ch=='{':
        brace+=1
    elif ch=='}':
        brace-=1
    elif ch=='[':
        brack+=1
    elif ch==']':
        brack-=1
    if paren<0 or brace<0 or brack<0:
        print('IMBALANCE at index',i,'line',line,'paren',paren,'brace',brace,'brack',brack)
        # print context
        print(s[max(0,i-40):i+40])
        break
else:
    print('Final counts: paren',paren,'brace',brace,'brack',brack)
    print('Fragment markers count open <>:', s.count('<>'), 'close </>:', s.count('</>'))
    # print last 200 chars
    print('TAIL:\n', s[-300:])
