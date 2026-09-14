import pytest
from pathlib import Path
import sys

# CORREÇÃO AQUI: adicionado mais um .parent para apontar para a verdadeira RAIZ do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

FORBIDDEN_CHARS = ["ÃƒÆ’", "Ãƒâ€š", "Ã¢â‚¬", "\ufffd", "ÃƒÂ§", "ÃƒÂ£", "ÃƒÂ©", "ÃƒÂ³", "ÃƒÂ­", "Ãƒ", "Ã©", "Ã³", "Ã§", "Ã£", "Ãµ", "Ã¡", "Ã¢", "Ãª", "Ãº"]

def test_no_mojibake():
    """Garante ausência de problemas de codificação (mojibake)."""
    erros = []
    arquivos = list(TEMPLATES_DIR.rglob("*.html")) + list(DATA_DIR.rglob("*.json"))
    for f in arquivos:
        text = f.read_text(encoding="utf-8")
        for token in FORBIDDEN_CHARS:
            if token in text:
                erros.append(f"Mojibake detectado: '{token}' em {f.name}")
    assert not erros, "\n".join(erros)

def test_team_photos_are_unique():
    """Testa se ocorreu bug de copy-paste resultando em membros usando a mesma foto."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_team, load_alumni
    
    people = load_team() + load_alumni()
    seen = {}
    for p in people:
        img = p.get("img")
        if not img or "placeholder" in img: 
            continue
            
        assert img not in seen, f"BUG DE CÓPIA: {p['name']} usa a mesma foto de {seen[img]} ({img})"
        seen[img] = p["name"]

def test_lattes_not_placeholder():
    """Garante que links Lattes não são placeholders inúteis."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_team, load_alumni
    people = load_team() + load_alumni()
    invalid_links = ("http://lattes.cnpq.br/", "https://lattes.cnpq.br/", "")
    
    for p in people:
        if "lattes" in p:
            assert p["lattes"].strip() not in invalid_links, f"Lattes inválido para: {p['name']}"

def test_static_files_exist_in_proceedings():
    """Garante que nenhum PDF listado nos anais dará página 404."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_proceedings_all
    data = load_proceedings_all()
    erros = []
    
    for vol in data.get('volumes', []):
        if vol.get('cover_img'):
            if not (STATIC_DIR / vol['cover_img']).exists():
                erros.append(f"Capa 404: {vol['cover_img']}")
                
        if vol.get('full_pdf_link'):
            if not (STATIC_DIR / vol['full_pdf_link']).exists():
                erros.append(f"PDF Volume 404: {vol['full_pdf_link']}")
                
        for cat in vol.get('categories', []):
            for art in cat.get('articles', []):
                # Testa direto a variável final de caminho de PDF gerada pelo loader
                pdf_path = art.get('pdf_path')
                if pdf_path and pdf_path != "#":
                    path = STATIC_DIR / pdf_path
                    if not path.exists():
                        erros.append(f"PDF Artigo 404: {pdf_path} ({art.get('title')})")

    assert not erros, "\n".join(erros)

if __name__ == "__main__":
    print("Iniciando suíte de testes de integridade...")
    exit_code = pytest.main(["-v", __file__])
    input("\nPressione ENTER para fechar a janela...")
    sys.exit(exit_code)