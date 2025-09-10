const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExpiredToken() {
  try {
    console.log('🔧 Fixing expired Gmail token...');
    
    // First, invalidate the expired token
    const invalidateResult = await prisma.$executeRaw`
      UPDATE [app].[EmailAuthTokens]
      SET [is_valid] = 0, [updated_at] = GETUTCDATE()
      WHERE [user_id] = 'current-user-id' AND [service_type] = 'GMAIL' AND [is_valid] = 1
    `;
    
    console.log(`✅ Invalidated ${invalidateResult} expired tokens`);
    
    // Check current token status
    const currentTokens = await prisma.$queryRaw`
      SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
      FROM [app].[EmailAuthTokens]
      WHERE [user_id] = 'current-user-id' AND [service_type] = 'GMAIL'
      ORDER BY [created_at] DESC
    `;
    
    console.log('📊 Current token status:');
    console.log(JSON.stringify(currentTokens, null, 2));
    
    console.log('✅ Token fix completed. Please re-authenticate your Gmail account.');
    
  } catch (error) {
    console.error('❌ Error fixing token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExpiredToken();
