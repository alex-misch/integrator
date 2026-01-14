// eslint-disable-next-line no-undef
// const offsetPagination = {
//   query: {
//     useInfinite: true,
//     useInfiniteQueryParam: 'offset',
//   },
// };

module.exports = {
  api: {
    input: {
      target: 'http://localhost:3003/swagger-json', // URL для получения Swagger схемы из NestJS
    },
    output: {
      mode: 'tags-split', // Разделение по тегам (группировка запросов)
      target: './src/api', // Путь для сохранения сгенерированных файлов API
      client: 'react-query', // Использование React Query для запросов
      prettier: true, // Форматирование кода с помощью Prettier
      override: {
        query: {
          signal: false,
        },
        mutator: {
          path: './src/customFetch.ts', // Указываем путь к кастомному fetch клиенту, если нужно
          name: 'customFetch', // Имя экспортируемого метода
          default: false, // Указываем, что функция не экспортируется по умолчанию
          alias: {
            TError: 'import("./src/types/error-types").TError', // Указываем кастомный тип ошибки
          },
        },
        operations: {
          // ExampleOffsetPaginationController: offsetPagination,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: ['prettier --write'],
    },
  },
};
