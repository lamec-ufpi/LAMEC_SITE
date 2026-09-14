import sys
from app import create_app
from flask_frozen import Freezer

# Instancia o app pela Factory
app = create_app()
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_DESTINATION'] = '../dist'
app.config['FREEZER_IGNORE_404_NOT_FOUND'] = False

freezer = Freezer(app)

# Injeta a geração dinâmica de URLs para os volumes dos anais
@freezer.register_generator
def volume_generator():
    from app.data.loader import load_proceedings_all
    from app.config import EVENT
    data = load_proceedings_all()
    for vol in data.get('volumes', []):
        yield 'proceedings.volume', {'volume_id': vol['id']}
    yield 'proceedings.volume', {'volume_id': EVENT["current_volume"]}

if __name__ == '__main__':
    print("Iniciando build estático para a pasta /dist ...")
    freezer.freeze()
    print("Build finalizado com sucesso!")