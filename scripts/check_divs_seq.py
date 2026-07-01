import re
from pathlib import Path
s=Path('frontend/src/App.js').read_text(encoding='utf-8')
text='\n'.join(s.splitlines())
open_pat=re.compile(r'<div\b[^>/]*>')
close_pat=re.compile(r'</div>')
# scan sequentially
pos=0
stack=[]
while pos < len(text):
    m_open=open_pat.search(text,pos)
    m_close=close_pat.search(text,pos)
    if m_open and (not m_close or m_open.start() < m_close.start()):
        stack.append((m_open.group(0), m_open.start()))
        pos=m_open.end()
    elif m_close:
        if stack:
            stack.pop()
        else:
            print('Extra closing </div> at', m_close.start())
            break
        pos=m_close.end()
    else:
        break
if stack:
    last_open=stack[-1]
    pos=last_open[1]
    line = text.count('\n',0,pos)+1
    print('Unclosed <div> detected. Last open at line', line, 'snippet:', last_open[0])
else:
    print('All <div> tags closed up to line 1020')
