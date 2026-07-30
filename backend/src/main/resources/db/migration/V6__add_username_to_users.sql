ALTER TABLE users ADD COLUMN username VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
