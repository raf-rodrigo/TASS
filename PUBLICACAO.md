# Publicação do TASS no Fly.io

O TASS é publicado exclusivamente no Fly.io. O destino é o app definido no
`fly.toml`, atualmente `tass-app-twilight-canyon-5020`, na região `gru`.
O endereço padrão é https://tass-app-twilight-canyon-5020.fly.dev/.
Frontend Vue/Vite e API Express são distribuídos na mesma imagem Docker.

## Pré-requisitos

- Node.js, npm e curl instalados, com as dependências do projeto (`npm ci`).
- CLI `fly` ou `flyctl` instalada e sessão autenticada com `fly auth login`.
- App já criado, com uma única máquina e o volume `tass_data` montado em `/data`.
- `TASS_DB_PATH=/data/tass-db.json` preservado no `fly.toml`.

`fly launch` prepara a criação inicial de um app. Não o execute a cada atualização:
as próximas publicações utilizam `fly deploy` no mesmo app.

## Publicar

A partir da raiz do projeto:

```bash
./deploy.sh --dry-run
./deploy.sh
```

Também é possível executar `npm run deploy`. O script funciona a partir de outros
diretórios e aceita `--help`.

O script lê o `fly.toml`, valida o destino e a persistência, confirma a existência
de uma única máquina com o volume correto, executa `npm test -- --run`,
`npm run lint` e `npm run build`. Qualquer falha interrompe a publicação.
Em seguida executa:

```bash
fly deploy --config fly.toml --app tass-app-twilight-canyon-5020 --remote-only --ha=false --yes
```

O build Docker acontece no builder remoto, sem exigir Docker local. `--ha=false`
evita criar uma máquina extra. O banco JSON não possui replicação entre máquinas;
o script recusa múltiplas máquinas em vez de alterar a escala automaticamente.

A publicação termina após verificar uma resposta HTTP de sucesso no site e
consultar o status do app. Uma falha nessa verificação após o deploy não desfaz
a publicação; consulte o status e os logs para diagnosticar.

O comando legado `./scripts/publish-tass.sh` encaminha para `./deploy.sh`.
A publicação por SSH/SCP e as opções `--target` e `--directory` não são utilizadas.
Não é necessário configurar `scripts/.env` para o deploy.

## Persistência e segredos

Mantenha o mesmo app, o volume `tass_data` e o caminho `/data/tass-db.json`.
O deploy substitui a imagem da máquina e preserva o volume. Trocar o nome do app
não migra os dados para o novo destino. Faça backups do conteúdo antes de
alterações de infraestrutura e não exclua o volume.

O script não altera os segredos existentes. Configure credenciais como
`JWT_SECRET` no painel de Secrets do Fly.io e preserve seu valor entre deploys.
Não registre tokens ou senhas no Git nem nos argumentos do script.

## Verificação e diagnóstico

```bash
fly status --app tass-app-twilight-canyon-5020
fly machine list --app tass-app-twilight-canyon-5020
fly volumes list --app tass-app-twilight-canyon-5020
fly logs --app tass-app-twilight-canyon-5020
curl -fL https://tass-app-twilight-canyon-5020.fly.dev/
```

O app utiliza parada e partida automáticas para períodos sem tráfego. Uma máquina
parada pode ser iniciada pelo primeiro acesso; o script repete a verificação HTTP.
Após publicar, confira login, tarefas, sprints, configurações e as alterações feitas.

Para recuperar uma versão anterior, utilize uma cópia separada do commit desejado
com o `fly.toml` do mesmo app e execute o script. Preserve o volume e os segredos.

Referência: https://fly.io/docs/launch/deploy/
