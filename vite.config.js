import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  // Use relative asset paths in production build so the site works both:
  // - on a custom domain at /
  // - on GitHub Pages project sites (e.g. https://user.github.io/repo/)
  const base = command === 'build' ? './' : '/';

  return {
    base,
    server: {
      host: true,
      port: 5173
    }
  };
});
