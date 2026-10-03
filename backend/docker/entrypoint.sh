#!/usr/bin/env sh
set -e

wait_for_db() {
    host="${DB_HOST:-db}"
    port="${DB_PORT:-3306}"
    tries="${DB_WAIT_TRIES:-60}"

    echo "[entrypoint] waiting for mysql at ${host}:${port} ..."

    i=0
    while [ "$i" -lt "$tries" ]; do
        if php -r '
            $host = getenv("DB_HOST") ?: "db";
            $port = (int) (getenv("DB_PORT") ?: 3306);
            $name = getenv("DB_DATABASE") ?: "erp";
            $user = getenv("DB_USERNAME") ?: "erp";
            $pass = getenv("DB_PASSWORD") ?: "";
            try {
                new PDO("mysql:host={$host};port={$port};dbname={$name}", $user, $pass);
                exit(0);
            } catch (Throwable $e) {
                exit(1);
            }
        ' 2>/dev/null; then
            echo "[entrypoint] mysql is ready"
            return 0
        fi
        i=$((i + 1))
        sleep 2
    done

    echo "[entrypoint] ERROR: database not reachable after ${tries} attempts" >&2
    return 1
}

ensure_env() {
    if [ ! -f /var/www/html/.env ]; then
        echo "[entrypoint] .env missing - copying from .env.example"
        cp /var/www/html/.env.example /var/www/html/.env
    fi

    if ! grep -q '^APP_KEY=base64:' /var/www/html/.env 2>/dev/null; then
        echo "[entrypoint] generating APP_KEY"
        php artisan key:generate --force --no-interaction
    fi

    php artisan config:clear --no-interaction
}

fix_permissions() {
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
    chmod -R ug+rwX /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
}

bootstrap_app() {
    cd /var/www/html

    ensure_env

    if [ "$("$PWD/artisan" --version 2>/dev/null)" = "" ]; then
        echo "[entrypoint] ERROR: artisan missing" >&2
        exit 1
    fi

    if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
        if wait_for_db; then
            echo "[entrypoint] running migrations"
            php artisan migrate --force --no-interaction

            if [ "${AUTO_SEED:-true}" = "true" ]; then
                if php artisan tinker --execute="exit(\Illuminate\Support\Facades\Schema::hasTable('users') && \Illuminate\Support\Facades\DB::table('users')->count() > 0 ? 1 : 0);" >/dev/null 2>&1; then
                    echo "[entrypoint] database already seeded"
                else
                    echo "[entrypoint] seeding demo data"
                    php artisan db:seed --force --no-interaction
                fi
            fi
        else
            echo "[entrypoint] skipping migrations (no database)"
        fi
    fi

    # migrations/seeding run as root and create root-owned files (e.g. the log);
    # hand them back to the php-fpm worker user before serving traffic
    fix_permissions
}

bootstrap_app

if [ "$#" -eq 0 ]; then
    exec php-fpm
fi

exec "$@"