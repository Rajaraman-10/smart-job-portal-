from pathlib import Path
s=Path('frontend/src/App.js').read_text(encoding='utf-8')
pat='\n      )}\n      </div>'
idx=s.find(pat)
print('idx',idx)
if idx!=-1:
    print(s[idx-200:idx+200])
else:
    print('pattern not found')
