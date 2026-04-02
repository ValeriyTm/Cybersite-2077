import type { Preview } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

//Создаём экземпляр клиента React Query (будет единым для всех компонентов):
const queryClient = new QueryClient();

//Объект настроек Storybook, который определяет, как будут отображаться и вести себя  «истории» (компоненты):
const preview: Preview = {
  parameters: {
    controls: {
      //Если Storybook видит в пропсах слова color или date, он автоматически подставит удобный пикер цвета или календарь:
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  //Глобальные декораторы (позволяют окружить компонент необходимыми провайдерами, не прописывая их в каждой стори отдельно):
  decorators: [
    //Функция-декоратор принимает текущую историю (Story) как аргумент:
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      </QueryClientProvider>
    ),
  ],
};

//Экспорт конфигурации, чтобы Storybook подхватил её при запуске:
export default preview;
