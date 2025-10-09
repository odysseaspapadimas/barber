-- Create admin user for Better Auth
-- This will be used with password from ADMIN_PASSWORD env var

INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
VALUES (
  'admin',
  'Admin',
  'admin@kypseli.com',
  1,
  NULL,
  CAST(unixepoch('subsecond') * 1000 AS INTEGER),
  CAST(unixepoch('subsecond') * 1000 AS INTEGER)
);

-- Note: Password will be set via Better Auth API
-- You'll need to manually set the password after running this migration
