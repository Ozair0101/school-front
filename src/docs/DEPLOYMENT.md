# Deployment Guide

This document explains how to deploy the React frontend for the online monthly exam system.

## Prerequisites

- Node.js (version 16 or higher)
- npm (version 8 or higher)
- A web server (Apache, Nginx, etc.)

## Build Process

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

This will create a `dist` folder with the production-ready files.

## Environment Configuration

Before building, make sure to set the correct environment variables:

```bash
# .env.production
VITE_API_URL=https://your-backend-domain.com/api
VITE_WEBSOCKET_URL=https://your-backend-domain.com
```

Update the baseURL in `services/api.ts` to point to your production backend:

```typescript
this.axiosInstance = axios.create({
  baseURL: 'https://your-backend-domain.com/api',
  // ...
});
```

## Web Server Configuration

### Apache

Add this to your `.htaccess` file in the root of your build directory:

```apache
Options -MultiViews
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Nginx

Add this to your server configuration:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Deployment Steps

1. Build the application:
```bash
npm run build
```

2. Copy the contents of the `dist` folder to your web server's document root

3. Configure your web server to serve the files and handle routing (see above)

4. Ensure your backend API is accessible from the frontend domain (CORS settings)

## Offline Support Considerations

For offline support to work properly in production:

1. Ensure your web server is configured to serve the site over HTTPS
2. The service worker (if used) should be properly registered
3. localStorage and IndexedDB should be accessible

## Security Considerations

1. Always use HTTPS in production
2. Set appropriate CORS headers on your backend
3. Use environment variables for API endpoints and secrets
4. Implement proper authentication and authorization
5. Regularly update dependencies to address security vulnerabilities

## Monitoring and Analytics

Consider adding monitoring tools like:

- Error tracking (Sentry, Rollbar)
- Performance monitoring (Google Analytics, New Relic)
- Uptime monitoring

## Troubleshooting

### Blank Page After Deployment

1. Check browser console for JavaScript errors
2. Verify all environment variables are set correctly
3. Ensure the API is accessible from the frontend domain
4. Check web server configuration for routing

### API Connection Issues

1. Verify the API URL is correct in `services/api.ts`
2. Check CORS settings on the backend
3. Ensure the backend is running and accessible
4. Check for network/firewall issues

### Offline Support Not Working

1. Verify HTTPS is enabled
2. Check that localStorage and IndexedDB are accessible
3. Ensure the service worker is registered correctly
4. Test in an incognito/private browsing window

## Scaling Considerations

For high-traffic deployments:

1. Use a CDN to serve static assets
2. Implement caching strategies
3. Consider server-side rendering for better performance
4. Use load balancing for multiple server instances
5. Monitor resource usage and scale accordingly