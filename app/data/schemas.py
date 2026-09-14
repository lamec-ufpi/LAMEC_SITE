def validate_article(article, vol_id):
    assert "title" in article, f"Artigo sem título no volume {vol_id}"
    assert "authors" in article, f"Artigo sem autores no volume {vol_id}"