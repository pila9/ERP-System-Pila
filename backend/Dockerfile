# syntax=docker/dockerfile:1

# ---------- Stage 1: Laravel skeleton + composer dependencies ----------
FROM php:8.3-fpm-alpine AS vendor

RUN apk add --no-cache \
        git unzip icu-dev oniguruma-dev libzip-dev postgresql-dev \
        freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev \
        libxpm-dev libxml2-dev linux-headers $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql pdo_pgsql bcmath intl opcache pcntl zip gd exif soap \
    && apk del --no-network $PHPIZE_DEPS \
    && rm -rf /tmp/*

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

WORKDIR /tmp/skel

# Official skeleton provides artisan, bootstrap/, config/, public/, storage/
RUN composer create-project --no-install --no-scripts --prefer-dist --no-progress laravel/laravel:^11.0 /tmp/skel

# Project dependencies (laravel/framework, sanctum, ...)
COPY composer.json /tmp/skel/composer.json
RUN composer install --no-progress --prefer-dist --optimize-autoloader --no-dev || \
    composer install --no-progress --prefer-dist --optimize-autoloader

# ---------- Stage 2: application code ----------
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        git unzip icu-dev oniguruma-dev libzip-dev postgresql-dev \
        freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev \
        libxpm-dev libxml2-dev linux-headers $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql pdo_pgsql bcmath intl opcache pcntl zip gd exif soap \
    && apk del --no-network $PHPIZE_DEPS \
    && rm -rf /tmp/*

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_NO_INTERACTION=1

# Runtime helper: wait for MySQL before migrating
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-erp.ini

WORKDIR /var/www/html

# vendor/ + skeleton already baked in
COPY --from=vendor /tmp/skel/vendor /var/www/html/vendor
COPY --from=vendor /tmp/skel/artisan /var/www/html/artisan
COPY --from=vendor /tmp/skel/public /var/www/html/public

# Application code (app/, database/, routes/, bootstrap/, config/, .env.example, ...)
COPY . /var/www/html

RUN cp -n /var/www/html/.env.example /var/www/html/.env || true \
    && mkdir -p /var/www/html/storage/framework/{cache/data,sessions,views,testing} \
             /var/www/html/storage/app/{public,private} \
             /var/www/html/storage/logs \
             /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && php artisan config:clear --no-interaction || true \
    && php artisan package:discover --ansi || true

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]