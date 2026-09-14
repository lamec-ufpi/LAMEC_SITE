## adding new volume to the proceedings

Add a file like vol_#_YEAR.json

{
  "id": "vol_#_YEAR",
  "title": "SIMCOMPI - Vol. # (YEAR)",
  "year": [YEAR],
  "cover_img": "simcompi/simcompi_#/[NAME OF THE IMAGE AND EXTENSION]",
  "full_pdf_link": "vol#/vol#_complete_simcompi.pdf",
  "categories": [
    {
      "name": "[NAME OF TEMATIC AREA]",
      "articles": [
        {
          "title": "[TITLE OF THE ARTICLE]",
          "authors": "[ALL AUTHORS SEPARATED BY COMMA]",
          "doi": null, // leave it "null" if doesn't have a DOI
          "abstract": "[FULL ABSTRACT]",
          "pdf": "vol#/article.pdf" 
        }
      ]
    }
  ]
}

in '"pdf": ' follow this pattern and add the PDFs to the folder static/proceedings/vol#/

## adding new team members

- follow the pattern
- don't repeat memeber pictures or lattes link, even if you have to put a placeholder
- some data is mandatory, but we will need a bug hunting to discover :)