from flask import Blueprint, render_template
from ..data.loader import load_publications

bp = Blueprint('main', __name__)

@bp.route('/')
def index(): return render_template('pages/index.html')

@bp.route('/about/')
def about(): return render_template('pages/about.html')

@bp.route('/publications/')
def publications():
    data = load_publications()
    return render_template('pages/publications.html',
                           journal_papers=data.get('journal_papers', []),
                           conference_papers=data.get('conference_papers', []))

@bp.route('/extension/bull-racing/')
def bull_racing(): 
    return render_template('extension/bull_racing.html')

@bp.route('/extension/faisca/')
def faisca(): 
    return render_template('extension/faisca.html')