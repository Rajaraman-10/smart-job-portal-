from pathlib import Path
p = Path('src/App.js')
lines = p.read_text(encoding='utf-8').splitlines()
block = '\n'.join(lines[617:1013])
text = 'const foo = ' + block + ';'
Path('temp_expr.js').write_text(text, encoding='utf-8')
