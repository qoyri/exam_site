-- Script pour vérifier la structure de la table absences
DESCRIBE absences;

-- Script pour créer une vue qui simplifie les requêtes d'absence
CREATE OR REPLACE VIEW absence_details AS
SELECT 
    a.id,
    a.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.class_id,
    c.name AS class_name,
    a.absence_date,
    a.status,
    a.reason,
    a.document,
    a.created_at,
    a.updated_at
FROM 
    absences a
INNER JOIN 
    students s ON a.student_id = s.id
INNER JOIN 
    classes c ON s.class_id = c.id;

-- Exemple d'utilisation de la vue
-- SELECT * FROM absence_details WHERE id = 1;
