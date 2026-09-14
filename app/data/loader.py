import json
from pathlib import Path
from .schemas import validate_article

# Aponta para a pasta /data na raiz do projeto
DATA_DIR = Path(__file__).parent.parent.parent / "data"

def _load_json(filename: str) -> dict:
    path = DATA_DIR / filename
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

def load_team() -> list: return _load_json("team.json").get("research_team", [])
def load_alumni() -> list: return _load_json("team.json").get("alumni", [])
def load_professional() -> list: return _load_json("team.json").get("professional_career", [])
def load_memoriam() -> list: return _load_json("team.json").get("in_memoriam", [])
def load_committees() -> dict: return _load_json("event_info.json").get("committees", {})
def load_publications() -> dict: return _load_json("publications.json")
def load_event_info() -> dict: return _load_json("event_info.json")

def load_proceedings_all() -> dict:
    volumes = []
    proc_dir = DATA_DIR / "proceedings"
    
    if proc_dir.exists():
        for f in proc_dir.glob("*.json"):
            raw = json.loads(f.read_text(encoding="utf-8"))
            
            # Normalização (ocorre 1x)
            if raw.get("full_pdf_link"):
                pdf_val = raw['full_pdf_link'].replace('proceedings/', '')
                raw["full_pdf_link"] = f"proceedings/{pdf_val}"
                
            if raw.get("cover_img"):
                img_val = raw['cover_img'].replace('images/', '')
                raw["cover_img"] = f"images/{img_val}"
                
            for cat in raw.get("categories", []):
                for article in cat.get("articles", []):
                    validate_article(article, raw.get('id', 'desconhecido'))
                    
                    pdf = article.get("pdf") or article.get("pdf_link", "")
                    if pdf:
                        clean_pdf = pdf.replace('../../../proceedings/', '').replace('proceedings/', '')
                        article["pdf_path"] = f"proceedings/{clean_pdf}"
                    else:
                        article["pdf_path"] = "#"
                    
                    # Trata DOI
                    doi_raw = article.get("doi") or ""
                    article["doi"] = str(doi_raw).strip() if str(doi_raw).strip() else None

            volumes.append(raw)
            
    volumes.sort(key=lambda x: x.get("year", 0), reverse=True)
    return {"volumes": volumes}

def load_proceedings_volume(volume_id: str) -> dict:
    all_vols = load_proceedings_all()
    return next((v for v in all_vols.get("volumes", []) if v["id"] == volume_id), None)