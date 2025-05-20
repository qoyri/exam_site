-- Renommer la colonne received_at en delivered_at si elle existe déjà
ALTER TABLE messages 
CHANGE COLUMN received_at delivered_at DATETIME NULL DEFAULT NULL;

-- Si la table n'existe pas encore, ce script sera ignoré
-- et la table sera créée avec la colonne delivered_at par le script create-messages-table.sql
