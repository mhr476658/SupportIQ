from pathlib import Path
import re, joblib
BASE=Path(__file__).resolve().parents[1]; MODEL_DIR=BASE/'models'
HIGH={'urgent','urgently','immediately','asap','emergency','critical','blocked','fraud','hacked','stolen','cannot access',"can't access",'account compromised','payment failed'}
MEDIUM={'soon','delay','delayed','not working','error','issue','problem','failed','unable','missing','late','incorrect'}
def clean_text(text):
    text=str(text or '').lower(); text=re.sub(r'http\S+|www\.\S+',' ',text); text=re.sub(r'[^a-z0-9\s]',' ',text); return re.sub(r'\s+',' ',text).strip()
def urgency(text):
    raw=str(text).lower(); h=sorted(k for k in HIGH if k in raw); m=sorted(k for k in MEDIUM if k in raw); return ('High',h) if h else (('Medium',m) if m else ('Low',[]))
def load(): return joblib.load(MODEL_DIR/'ticket_classifier.joblib'),joblib.load(MODEL_DIR/'tfidf_vectorizer.joblib')
