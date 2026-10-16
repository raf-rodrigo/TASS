# Publicação do TASS

Este arquivo descreve a atualização do frontend do TASS no ambiente de produção.

## Ambiente de produção

- Aplicação: SPA Vue/Vite servida como arquivos estáticos.
- Site: `https://tass.smresume.com`
- Diretório remoto padrão: `/srv/sites/tass`
- Script de publicação: `scripts/publish-tass.sh`
- Configuração local privada: `scripts/.env`

Execute os comandos locais a partir da raiz deste projeto.

## Pré-requisitos

- Node.js e npm instalados.
- Acesso SSH por chave ao servidor de produção.
- Diretório remoto existente e com permissão de escrita para o usuário do deploy.
- Arquivo `scripts/.env` configurado ou destino informado pela linha de comando.

Exemplo de `scripts/.env`:

```dotenv
TASS_DEPLOY_TARGET=USUARIO@HOST
TASS_DEPLOY_DIRECTORY=/srv/sites/tass
```

O arquivo é privado e ignorado pelo Git. Não registre senhas, tokens ou chaves
SSH neste documento.

Teste o acesso antes de publicar:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 USUARIO@HOST 'hostname'
```

## Atualizar a produção

### 1. Validar o projeto localmente

Execute os testes, a análise estática e o build de produção:

```bash
npm test -- --run
npm run lint
npm run build
```

Não prossiga se algum comando falhar.

### 2. Publicar

Se `scripts/.env` estiver configurado:

```bash
./scripts/publish-tass.sh
```

Também é possível informar o destino explicitamente:

```bash
./scripts/publish-tass.sh \
  --target USUARIO@HOST \
  --directory /srv/sites/tass
```

O script gera um novo build, valida o acesso ao diretório remoto e envia o
conteúdo de `dist/` para a produção.

### 3. Verificar a publicação

Evite uma resposta mantida pelo cache acrescentando um identificador à URL:

```bash
DEPLOY_CHECK="$(date +%s)"

curl -fsS -o /dev/null -w 'TASS: %{http_code}\n' \
  "https://tass.smresume.com/?v=${DEPLOY_CHECK}"
```

A resposta esperada é `200`. Abra também `https://tass.smresume.com` em uma
janela anônima ou recarregue a página ignorando o cache e confira o fluxo que
foi alterado.

Para esta correção, valide especificamente:

1. Abra o Breeze em **Mesclar e Excluir**.
2. Selecione uma branch e abra a confirmação de merge.
3. Cancele a operação.
4. Busque e selecione outra branch.
5. Confirme que os ambientes de destino continuam visíveis e que apenas a nova
   branch está selecionada.

## Diagnóstico de falha

Confirme primeiro se o HTML publicado está acessível:

```bash
curl -fsS https://tass.smresume.com/ | head
```

Confira depois se os arquivos referenciados pelo HTML existem no diretório
remoto:

```bash
ssh USUARIO@HOST 'find /srv/sites/tass -maxdepth 2 -type f | sort | tail -50'
```

Se o site ainda apresentar uma versão antiga, recarregue ignorando o cache e
verifique as regras de cache do proxy ou CDN responsável pelo domínio.

## Recuperação

O TASS é uma aplicação estática. Para retornar a uma versão anterior, gere o
build da versão desejada e execute novamente `scripts/publish-tass.sh`. Dados do
usuário ficam no navegador e nas integrações configuradas; a publicação não deve
apagar bancos, backups ou credenciais externas.
