## Окружение: сделать 1 раз

- Создай dev окружение для сервисов

```sh
pnpm --parallel setup-env:dev
```

- Создай docker контейнеры второстепенных сервисов

```sh
docker-compose up -d
```

- Запусти миграции в базе и создай сидов

```sh
pnpm -F api migration:run
pnpm -F api seed:run
```

## Запуск: каждый раз перед разработкой

Запуск бэкенда:

```sh
pnpm -F api dev
```

Запуск фронтенда:

```sh
pnpm -F miniapp dev
```

Запуск админки:

```sh
pnpm -F cms dev
```

## Во время разработки

После изменения бэкенда нужно перегенерить API слой фронтеда. Работает это только с запущенным бекендом.

```sh
pnpm -F api-client generate
```

При изменениях в entities, создай миграцию и примени её.

- Проверь, в миграции только твои изменения
- Проверь, что фича с миграцией работает

```sh
pnpm -F api migration:generate src/migrations/<MigrationName>
pnpm -F api migration:run
```
