CREATE TABLE records (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    job TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COPY records (name, job)
FROM '/docker-entrypoint-initdb.d/records.csv'
WITH (FORMAT csv, HEADER true);

SELECT setval(pg_get_serial_sequence('records', 'id'), COALESCE(MAX(id), 1)) FROM records;
