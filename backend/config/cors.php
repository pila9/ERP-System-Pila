<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS)
|--------------------------------------------------------------------------
|
| The SPA is served from a different origin than this API (for example a
| Vercel domain), so browser requests arrive cross-origin. List the allowed
| front-end origins in CORS_ALLOWED_ORIGINS as a comma separated value.
|
| When the variable is empty the API falls back to "*", which is what local
| development needs. The API authenticates with bearer tokens rather than
| cookies, so credentials are not required.
|
*/

$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins ?: ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,
];
