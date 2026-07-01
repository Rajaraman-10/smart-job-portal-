from pathlib import Path
p = Path('src/App.js')
lines = p.read_text(encoding='utf-8').splitlines()
stack = []
pairs = {')':'(', '}':'{', ']':'['}
openers = set(pairs.values())
for idx, line in enumerate(lines, 1):
    for ch in line:
        if ch in openers:
            stack.append((ch, idx, line.strip()))
        elif ch in pairs:
            if not stack:
                print('unmatched closing', ch, idx, line.strip())
                raise SystemExit(1)
            last, last_idx, last_line = stack.pop()
            if last != pairs[ch]:
                print('mismatch', last, last_idx, last_line)
                print('with', ch, idx, line.strip())
                raise SystemExit(1)
    if idx in [618, 839, 1014, 1015, 1307, 1308, 1309, 1310]:
        print('Line', idx, 'stack len', len(stack))
        print('Top 15:', stack[-15:])
print('END stack len', len(stack))
