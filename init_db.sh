#!/bin/bash

# Crée le dossier 'data' si nécessaire
if [ ! -d data ]; then
    mkdir data
fi

# Crée la base de données si elle n'existe pas
if [ ! -f data/project.db ]; then
    touch data/project.db
    ./node_modules/.bin/better-sqlite3 data/project.db < db_install.sql
fi
