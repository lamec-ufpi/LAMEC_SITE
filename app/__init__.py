from flask import Flask, request
from .config import EVENT, CURRENT_YEAR

def create_app():
    # Aponta as pastas estáticas e templates subindo um nível, já que a pasta app/ está isolada
    app = Flask(__name__, template_folder='templates', static_folder='../static')

    # Injeção Global: mata hardcodes nos templates
    @app.context_processor
    def inject_global():
        return dict(
            current_endpoint=request.endpoint, 
            event=EVENT, 
            current_year=CURRENT_YEAR
        )

    # Registro dos Blueprints
    from .blueprints.main import bp as main_bp
    from .blueprints.people import bp as people_bp
    from .blueprints.proceedings import bp as proceedings_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(proceedings_bp)

    return app