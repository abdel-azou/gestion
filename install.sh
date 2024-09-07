#!/bin/bash

# Crée le dossier 'sqlite' si nécessaire
if [ ! -d sqlite ]; then
    mkdir sqlite
fi

# Télécharge et décompresse SQLite
curl https://www.sqlite.org/2024/sqlite-tools-win-x64-3450200.zip > sqlite/sqlite.zip
unzip -o sqlite/sqlite.zip -d sqlite > /dev/null

# Crée le dossier 'data' si nécessaire
if [ ! -d data ]; then
    mkdir data
fi

# Crée la base de données avec SQLite
./sqlite/sqlite3.exe data/project.db < db_install.sql > /dev/null
if [ $? != 0 ]; then
    echo "La création de la base de données a échoué" >&2
    exit 1
fi

# Installe les dépendances npm
npm install > /dev/null
if [ $? != 0 ]; then
    echo "L'installation des dépendances a échoué" >&2
    exit 1
fi
