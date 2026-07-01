from pathlib import Path
p = Path('src/App.js')
text = p.read_text(encoding='utf-8')
lines = text.splitlines()
# Check parentheses and braces in the return portion
start = 560
bal = {'(':0, ')':0, '{':0, '}':0, '[':0, ']':0}
for i in range(start-1, len(lines)):
    l = lines[i]
    for ch in l:
        if ch in bal:
            bal[ch] += 1
    if i+1 in (839, 1014, 1298, 1310, 1516, 1517, 1518):
        print(f"{i+1}: {bal}")
print('final', bal)
