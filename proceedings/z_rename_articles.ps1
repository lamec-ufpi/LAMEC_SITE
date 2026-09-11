# Script para normalizar nomes de arquivos
$pasta = Get-Location
Write-Host "Lendo arquivos em: $pasta" -ForegroundColor Cyan

$arquivos = Get-ChildItem -File

$contador = 0

foreach ($arq in $arquivos) {
    # Ignora os próprios scripts
    if ($arq.Name -eq $MyInvocation.MyCommand.Name -or $arq.Name -eq "renomear_arquivos.py") { continue }

    $nome = $arq.BaseName
    $ext = $arq.Extension.ToLower()

    # 1. Remover acentos (normaliza e remove diacríticos como ~, ´, ^, ç)
    $nome = $nome.Normalize([Text.NormalizationForm]::FormD)
    $nome = $nome -replace '\p{M}', ''

    # 2. Tudo em minúsculas
    $nome = $nome.ToLower()

    # 3. Substituir espaços em branco por hífens
    $nome = $nome -replace ' ', '-'

    # 4. Manter apenas letras (a-z), números (0-9), hífens e underlines (que já existirem)
    $nome = $nome -replace '[^a-z0-9\-_]', ''

    # 5. Remover múltiplos hífens seguidos resultantes de múltiplos espaços
    $nome = $nome -replace '-+', '-'

    $novoNome = $nome + $ext

    if ($arq.Name -cne $novoNome) {
        $novoCaminho = Join-Path -Path $arq.DirectoryName -ChildPath $novoNome
        
        # Verifica se já existe um arquivo com esse nome final
        if (Test-Path $novoCaminho) {
            Write-Host "[-] ERRO: '$novoNome' já existe. Pulando '$($arq.Name)'." -ForegroundColor Red
        } else {
            Rename-Item -Path $arq.FullName -NewName $novoNome
            Write-Host "[+] '$($arq.Name)' -> '$novoNome'" -ForegroundColor Green
            $contador++
        }
    }
}

Write-Host "`nConcluído! $contador arquivo(s) renomeado(s)." -ForegroundColor Cyan
