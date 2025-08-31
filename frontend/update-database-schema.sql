-- =====================================================
-- Database Schema Update for Dynamic OAuth System
-- =====================================================

-- Step 1: Add accountName field to EmailServiceConfigs table
-- This allows multiple Gmail accounts per user
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'app' 
    AND TABLE_NAME = 'EmailServiceConfigs' 
    AND COLUMN_NAME = 'accountName'
)
BEGIN
    ALTER TABLE [db_address_book].[app].[EmailServiceConfigs]
    ADD [accountName] NVARCHAR(255) NULL;
    
    PRINT '✅ Added accountName field to EmailServiceConfigs table';
END
ELSE
BEGIN
    PRINT 'ℹ️  accountName field already exists in EmailServiceConfigs table';
END

-- Step 2: Add index for better performance on user-specific queries
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_EmailServiceConfigs_UserId_ServiceType_AccountName'
)
BEGIN
    CREATE INDEX [IX_EmailServiceConfigs_UserId_ServiceType_AccountName]
    ON [db_address_book].[app].[EmailServiceConfigs] ([userId], [serviceType], [accountName]);
    
    PRINT '✅ Created index for EmailServiceConfigs table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index already exists for EmailServiceConfigs table';
END

-- Step 3: Add index for EmailAuthTokens table
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_EmailAuthTokens_UserId_ServiceType'
)
BEGIN
    CREATE INDEX [IX_EmailAuthTokens_UserId_ServiceType]
    ON [db_address_book].[app].[EmailAuthTokens] ([userId], [serviceType]);
    
    PRINT '✅ Created index for EmailAuthTokens table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index already exists for EmailAuthTokens table';
END

-- Step 4: Verify the updated schema
PRINT '';
PRINT '📋 VERIFYING UPDATED SCHEMA:';
PRINT '==============================';

-- Check EmailServiceConfigs table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'app' 
AND TABLE_NAME = 'EmailServiceConfigs'
ORDER BY ORDINAL_POSITION;

-- Check EmailAuthTokens table structure
PRINT '';
PRINT 'EmailAuthTokens table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'app' 
AND TABLE_NAME = 'EmailAuthTokens'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '🎯 SCHEMA UPDATE COMPLETED!';
PRINT '============================';
PRINT 'Your database is now ready for the dynamic OAuth system.';
PRINT 'Next step: Restart your backend server.';
