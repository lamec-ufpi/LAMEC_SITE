import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = BASE_DIR / "static"

def run():
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_proceedings_all, load_team, load_alumni

    expected_assets = set()

    # Coleta assets dos anais
    proc_data = load_proceedings_all()
    for vol in proc_data.get('volumes', []):
        if vol.get('cover_img'): expected_assets.add(vol['cover_img'])
        if vol.get('full_pdf_link'): expected_assets.add(vol['full_pdf_link'])
        for cat in vol.get('categories', []):
            for art in cat.get('articles', []):
                if art.get('pdf_path') and art.get('pdf_path') != '#':
                    expected_assets.add(art['pdf_path'])

    # Coleta assets da equipe
    for p in load_team() + load_alumni():
        if p.get('img') and "placeholder" not in p['img']:
            expected_assets.add(p['img'].replace('images/', 'images/'))

    errors = []
    for asset in expected_assets:
        if not (STATIC_DIR / asset).exists():
            errors.append(f"ARQUIVO FALTANDO: {asset}")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print("Verificação de assets concluída com sucesso.")

if __name__ == "__main__":
    run()