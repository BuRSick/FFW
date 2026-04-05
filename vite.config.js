import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
  const base = command === 'build' && repoName ? `/${repoName}/` : '/';

  return {
    base,
    server: {
      host: true,
      port: 5173
    }
  };
});
