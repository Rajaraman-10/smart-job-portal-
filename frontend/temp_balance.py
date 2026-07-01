from pathlib import Path
p = Path('src/App.js')
lines = p.read_text(encoding='utf-8').splitlines()
stack = []
pairs = {')':'(', '}':'{', ']':'['}
openers = set(pairs.values())
for idx, line in enumerate(lines, 1):
    for ch in line:
        if ch in openers:
            stack.append((ch, idx, line))
        elif ch in pairs:
            if not stack:
                print('unmatched closing', ch, idx, line)
                raise SystemExit(1)
            last, last_idx, last_line = stack.pop()
            if last != pairs[ch]:
                print('mismatch', last, last_idx, last_line)
                print('with', ch, idx, line)
                raise SystemExit(1)
    if idx == 1014:
        print('checkpoint 1014 stack len', len(stack))
        # print top 10 stack items
        for item in stack[-10:]:
            print(item)
print('end stack len', len(stack))
