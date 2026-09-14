# Nome do arquivo final
$OutputFile = "z_lista_de_arquivos.md"

# Apaga o arquivo anterior se ele já existir na pasta
if (Test-Path $OutputFile) { Remove-Item $OutputFile }

# Adiciona um título ao Markdown
"# Estrutura de Arquivos do Projeto`n" | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Lendo arquivos..." -ForegroundColor Cyan

# Pega todos os arquivos recursivamente, ignorando pastas vazias e o próprio script
$Files = Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Name -ne $MyInvocation.MyCommand.Name -and $_.Name -ne $OutputFile }

foreach ($File in $Files) {
    # Extrai o caminho relativo (ex: .\src\index.html)
    $RelativePath = Resolve-Path -Path $File.FullName -Relative
    
    # Troca as barras invertidas do Windows por barras normais (opcional, mas fica melhor no MD)
    $RelativePath = $RelativePath -replace '\\', '/'
    
    # Formata a linha. Para imprimir uma crase (`) no MD, usamos duas (``) no PS.
    $Line = "- ``$RelativePath``"
    
    # Salva linha a linha no arquivo
    $Line | Out-File -FilePath $OutputFile -Append -Encoding UTF8
}

Write-Host "Concluído! Lista gerada em: $OutputFile" -ForegroundColor Green