@echo off
echo Marking all migrations as applied...

npx prisma migrate resolve --applied 20251021110242_add_guest_profile_fields
npx prisma migrate resolve --applied 20251021123005_add_device_manager_models
npx prisma migrate resolve --applied 20251021202438_add_user_preferences
npx prisma migrate resolve --applied 20251022161316_add_yacht_settings_table
npx prisma migrate resolve --applied 20251022165551_add_foundation_tables
npx prisma migrate resolve --applied 20251022202426_update_yacht_settings
npx prisma migrate resolve --applied 20251022221611_add_service_category
npx prisma migrate resolve --applied 20251023175413_add_service_request_fields
npx prisma migrate resolve --applied 20251023202621_add_performance_indexes
npx prisma migrate resolve --applied 20251023205612_add_duty_roster_models
npx prisma migrate resolve --applied 20251026114437_add_unique_smartButtonId
npx prisma migrate resolve --applied 20251026224630_service_request_status_enum
npx prisma migrate resolve --applied 20251026225257_priority_requesttype_enums
npx prisma migrate resolve --applied 20251026225959_guest_status_type_enums
npx prisma migrate resolve --applied 20251026230801_crew_member_status_enum
npx prisma migrate resolve --applied 20251026_add_database_constraints
npx prisma migrate resolve --applied 20251027_add_indexes_and_constraints
npx prisma migrate resolve --applied 20251027_add_missing_fk_constraints
npx prisma migrate resolve --applied 20251027_convert_device_status_to_enum
npx prisma migrate resolve --applied 20251027_convert_message_and_activitylog_to_enums
npx prisma migrate resolve --applied 20251027_convert_user_role_to_enum

echo.
echo ✅ All migrations marked as applied!
pause
