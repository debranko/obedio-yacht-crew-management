-- Check what enum types exist
SELECT t.typname AS enum_name,
       e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('ServiceRequestStatus', 'ServiceRequestType', 'ServiceRequestPriority')
ORDER BY t.typname, e.enumsortorder;

-- Check current status column type
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ServiceRequest'
  AND column_name IN ('status', 'requestType', 'priority');
