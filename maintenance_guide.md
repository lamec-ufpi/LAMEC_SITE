# LAMEC Site - Guia de Manutenção

Este documento contém instruções rápidas para manter e atualizar o conteúdo do site sem precisar alterar a lógica de roteamento ou de build.

## ⚠️ Regra de Ouro: Sempre rode os testes!
Toda vez que você adicionar ou editar um arquivo JSON, imagem ou PDF, **você deve rodar os testes de integridade antes de fazer o push para o GitHub**. Isso previne erros de digitação, fotos duplicadas e links 404.

No terminal, na raiz do projeto, rode:
`pytest app/tests/test_integrity.py`

Se passar, você pode commitar. Se quebrar, o GitHub Actions **vai bloquear** a atualização do site.

---

## 1. Adicionar um Novo Volume de Anais
Quando o SIMCOMPI acabar e os PDFs forem gerados:
1. Vá em `data/proceedings/` e crie um arquivo novo (ex: `vol_4_2029.json`).
2. Siga exatamente esta estrutura (Nota: Não adicione comentários com `//` dentro do JSON, pois isso quebra o parser):

```json
{
  "id": "vol_4_2029",
  "title": "IV SIMCOMPI - Vol. 4 (2029)",
  "year": 2029,
  "cover_img": "simcompi/simcompi_4/capa.png",
  "full_pdf_link": "vol4/vol4_complete.pdf",
  "categories": [
    {
      "name": "Nome da Área/Categoria",
      "articles": [
        {
          "title": "Título do Artigo",
          "authors": "Autor A, Autor B",
          "doi": "[https://doi.org/10](https://doi.org/10)...",
          "abstract": "Resumo do artigo...",
          "keywords": "Palavra, Outra",
          "pdf": "vol4/artigo1.pdf"
        }
      ]
    }
  ]
}
```

Se um artigo não tiver DOI, coloque o valor como null (sem aspas).
3. Atualize o current_volume no arquivo app/config.py para apontar para o novo ID (vol_4_2029).


## 2. Atualizar Membros da Equipe ou Alumni

Abra data/team.json e adicione o novo membro na categoria apropriada. O site gera os modais e os links do Lattes automaticamente.

{
  "name": "Nome Sobrenome",
  "role": "Função ou Destino",
  "img": "images/team/foto.jpg",
  "lattes": "[https://lattes.cnpq.br/123456789](https://lattes.cnpq.br/123456789)",
  "bio": "<b>Posição Atual:</b> Opcional. <br> Aceita tags HTML."
}

## 3. Criar a Página de uma Edição Anterior (SIMCOMPI)

Crie o template em app/templates/simcompi/edicoes-anteriores/novo_arquivo.html.

Adicione a rota no arquivo app/blueprints/proceedings.py.

Adicione o link da nova página no menu dropdown em app/templates/components/navbar.html.

Para adicionar o carrossel de fotos (Slider): Utilize a variável slides injetando os caminhos da pasta static e passe via atributo data-slides diretamente no HTML, sem precisar tocar em JavaScript:

```html
{% set slides = [
  url_for('static', filename='images/simcompi/simcompi_4/slide/foto1.jpg'),
  url_for('static', filename='images/simcompi/simcompi_4/slide/foto2.jpg')
] %}
<img id="simcompi-4-slider" data-slides='{{ slides | tojson | safe }}' alt="Galeria">
```