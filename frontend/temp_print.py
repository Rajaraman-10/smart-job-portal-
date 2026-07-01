from pathlib import Path
p = Path('src/App.js')
lines = p.read_text(encoding='utf-8').splitlines()
for i in range(618, 1016):
    print(f'{i}: {lines[i-1]}')
