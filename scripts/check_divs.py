import re
from pathlib import Path
s=Path('frontend/src/App.js').read_text(encoding='utf-8')
lines=s.splitlines()
text='\n'.join(lines[:1020])  # analyze up to 1020
open_pat=re.compile(r'<div\b[^>/]*>')
close_pat=re.compile(r'</div>')
stack=[]
index=0
for m in open_pat.finditer(text):
    stack.append((m.group(0), m.start()))
for m in close_pat.finditer(text):
    if stack:
        stack.pop()
    else:
        print('Extra closing </div> at', m.start())
        break
if stack:
    last_open=stack[-1]
    # find line number
    pos=last_open[1]
    line = text.count('\n',0,pos)+1
    print('Unclosed <div> detected. Last open at line', line, 'snippet:', last_open[0])
else:
    print('All <div> tags closed up to line 1020')
