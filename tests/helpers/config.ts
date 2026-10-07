// Never commit a token: set it in the environment or in the git-ignored
// `.env.development.local` file.
export const ACCESS_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ??
  '') as string;

export const MAP_STYLE = 'mapbox://styles/mapbox/streets-v9?optimize=true';

/**
 * Stands in for the host app's `config/environment.js`.
 */
export default {
  modulePrefix: 'test-app',
  'mapbox-gl': {
    accessToken: ACCESS_TOKEN,
    map: {
      style: MAP_STYLE,
    },
  },
};
