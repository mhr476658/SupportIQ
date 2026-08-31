from pathlib import Path
import joblib,json,pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score,f1_score,classification_report
from app.model import clean_text
B=Path(__file__).resolve().parent; df=pd.read_csv(B/'data/support_tickets.csv').dropna(); df['clean']=df.text.map(clean_text)
Xtr,Xte,ytr,yte=train_test_split(df.clean,df.category,test_size=.25,random_state=42,stratify=df.category)
v=TfidfVectorizer(ngram_range=(1,2),sublinear_tf=True); A=v.fit_transform(Xtr); model=LogisticRegression(max_iter=2000,class_weight='balanced'); model.fit(A,ytr); p=model.predict(v.transform(Xte))
metrics={'accuracy':accuracy_score(yte,p),'weighted_f1':f1_score(yte,p,average='weighted'),'report':classification_report(yte,p,output_dict=True)}
(B/'models').mkdir(exist_ok=True); joblib.dump(model,B/'models/ticket_classifier.joblib'); joblib.dump(v,B/'models/tfidf_vectorizer.joblib'); (B/'models/metrics.json').write_text(json.dumps(metrics,indent=2)); print(f"Accuracy: {metrics['accuracy']:.4f}\nWeighted F1: {metrics['weighted_f1']:.4f}")
