from pathlib import Path
s=Path('frontend/src/App.js').read_text(encoding='utf-8').splitlines()
for i,line in enumerate(s, start=1):
    if '</>' in line or '<div className="jobseeker-section"' in line or '<MyApplicationsModule' in line:
        print(i, line)
print('\nTotal lines:', len(s))
