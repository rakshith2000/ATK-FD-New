#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- Keycloak DB + user
    CREATE USER keycloak_user WITH PASSWORD '<YOUR_KEYCLOAK_DB_PASSWORD>';
    CREATE DATABASE keycloak_db OWNER keycloak_user;
    GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO keycloak_user;

    -- LiteLLM DB + user
    CREATE USER litellm_user WITH PASSWORD '<YOUR_LITELLM_DB_PASSWORD>';
    CREATE DATABASE litellm_db OWNER litellm_user;
    GRANT ALL PRIVILEGES ON DATABASE litellm_db TO litellm_user;

EOSQL

# Enable pgvector in the main ATK database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL
