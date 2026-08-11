"""Local, offline resume scanning: text extraction + skill/match scoring.

No external API calls — uses pdfplumber/PyPDF2/python-docx for text
extraction and scikit-learn's TF-IDF + cosine similarity for scoring,
so this runs synchronously on every application with no cost or key.
"""
import re

SKILL_KEYWORDS = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'nosql',
    'react', 'react native', 'angular', 'vue', 'next.js', 'redux', 'html', 'css', 'sass',
    'tailwind', 'bootstrap', 'jquery',
    'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot', '.net',
    'rest api', 'graphql', 'microservices',
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'dynamodb', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
    'ci/cd', 'git', 'github', 'gitlab', 'linux', 'bash', 'nginx',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
    'scikit-learn', 'pandas', 'numpy', 'data analysis', 'data science', 'data engineering',
    'agile', 'scrum', 'jira', 'project management', 'product management',
    'figma', 'ui/ux', 'photoshop', 'illustrator',
    'communication', 'leadership', 'teamwork', 'problem solving',
    'seo', 'digital marketing', 'content writing', 'salesforce', 'excel', 'power bi', 'tableau',
]

_SKILL_PATTERNS = [
    (skill, re.compile(r'(?<![A-Za-z0-9])' + re.escape(skill) + r'(?![A-Za-z0-9])', re.IGNORECASE))
    for skill in SKILL_KEYWORDS
]


def extract_text_from_resume(application):
    """Best-effort text extraction from resume_file (PDF/DOCX) or the resume text field."""
    resume_file = application.resume_file
    if resume_file:
        name = (resume_file.name or '').lower()
        try:
            resume_file.open('rb')
            try:
                if name.endswith('.docx'):
                    text = _extract_docx_text(resume_file)
                else:
                    text = _extract_pdf_text(resume_file)
            finally:
                resume_file.close()
            if text.strip():
                return text
        except Exception:
            pass
    return application.resume or ''


def _extract_pdf_text(file_obj):
    import pdfplumber
    text_parts = []
    file_obj.seek(0)
    with pdfplumber.open(file_obj) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or '')
    text = '\n'.join(text_parts)
    if text.strip():
        return text

    import PyPDF2
    file_obj.seek(0)
    reader = PyPDF2.PdfReader(file_obj)
    return '\n'.join((page.extract_text() or '') for page in reader.pages)


def _extract_docx_text(file_obj):
    import docx
    file_obj.seek(0)
    document = docx.Document(file_obj)
    return '\n'.join(p.text for p in document.paragraphs)


def extract_skills_from_text(text):
    if not text:
        return []
    found = [skill for skill, pattern in _SKILL_PATTERNS if pattern.search(text)]
    return sorted(found)


def _parse_skill_list(raw):
    if not raw:
        return []
    return sorted({s.strip() for s in re.split(r'[,;/]', raw) if s.strip()})


def compute_text_similarity(resume_text, job_text):
    resume_text = (resume_text or '').strip()
    job_text = (job_text or '').strip()
    if not resume_text or not job_text:
        return 0.0
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(stop_words='english')
        matrix = vectorizer.fit_transform([resume_text, job_text])
        score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return round(float(score) * 100, 1)
    except ValueError:
        return 0.0


def scan_application(application):
    """Scan an Application's resume against its Job and return AI match fields.

    Never raises: on any extraction/scoring failure, returns a neutral result
    so a bad resume file can never block an application from being saved.
    """
    try:
        resume_text = extract_text_from_resume(application)
        extracted_skills = extract_skills_from_text(resume_text)
        declared_skills = _parse_skill_list(application.skills)
        candidate_skills = {s.lower() for s in extracted_skills} | {s.lower() for s in declared_skills}

        job = application.job
        required_skills = _parse_skill_list(getattr(job, 'required_skills', ''))

        if required_skills:
            matched = sorted({s for s in required_skills if s.lower() in candidate_skills})
            missing = sorted({s for s in required_skills if s.lower() not in candidate_skills})
            skill_ratio = len(matched) / len(required_skills)
        else:
            matched, missing, skill_ratio = [], [], None

        job_text = ' '.join(filter(None, [
            getattr(job, 'title', ''),
            getattr(job, 'description', ''),
            getattr(job, 'required_skills', ''),
        ]))
        similarity_score = compute_text_similarity(resume_text, job_text)

        if skill_ratio is not None:
            match_score = round((skill_ratio * 70) + (similarity_score * 0.3), 1)
        else:
            match_score = similarity_score

        return {
            'ai_match_score': min(match_score, 100.0),
            'ai_matched_skills': matched,
            'ai_missing_skills': missing,
        }
    except Exception:
        return {
            'ai_match_score': None,
            'ai_matched_skills': [],
            'ai_missing_skills': [],
        }
