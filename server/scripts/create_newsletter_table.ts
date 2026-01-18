import { createSupabaseClient } from '../lib/supabase';

async function createNewsletterTable() {
  try {
    console.log('Creating newsletter_subscribers table...');
    
    // Use service role for admin operations
    const supabase = createSupabaseClient(true);
    
    // Create the table using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "subscribed_at" TIMESTAMP(3) NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" 
        ON "public"."newsletter_subscribers"("email");
      `
    });

    if (error) {
      console.error('Error creating newsletter table:', error);
      throw error;
    }

    console.log('✅ Newsletter subscribers table created successfully!');
  } catch (error) {
    console.error('Failed to create newsletter table:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createNewsletterTable();
}

export { createNewsletterTable };