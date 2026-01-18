import { config } from 'dotenv';
import { createSupabaseClient } from '../lib/supabase';

// Load environment variables
config();

async function setupNewsletterTable() {
  try {
    console.log('🔄 Setting up newsletter_subscribers table...');
    
    // Use service role for admin operations
    const supabase = createSupabaseClient(true);
    
    // First, try to create the table
    console.log('📝 Creating newsletter_subscribers table...');
    
    const createTableSQL = `
      -- Create newsletter_subscribers table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "subscribed_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
      );
      
      -- Create unique index on email
      CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" 
      ON "public"."newsletter_subscribers"("email");
      
      -- Enable Row Level Security
      ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers";
      DROP POLICY IF EXISTS "Allow service role full access" ON "public"."newsletter_subscribers";
      
      -- Create policy to allow anonymous inserts (for newsletter signup)
      CREATE POLICY "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers"
          FOR INSERT TO anon
          WITH CHECK (true);
      
      -- Create policy to allow service role full access
      CREATE POLICY "Allow service role full access" ON "public"."newsletter_subscribers"
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
    `;

    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try creating the table manually
      console.log('🔄 Trying alternative approach...');
      
      // Try to create the table directly
      const { error: createError } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .limit(1);
      
      if (createError && createError.code === '42P01') {
        // Table doesn't exist, need to create it
        console.error('❌ Table does not exist. Please run the SQL script manually in Supabase SQL Editor:');
        console.log('\n--- COPY AND PASTE THIS SQL INTO SUPABASE SQL EDITOR ---\n');
        console.log(createTableSQL);
        console.log('\n--- END SQL SCRIPT ---\n');
        throw new Error('Please create the table manually using the SQL script above');
      } else if (createError) {
        console.error('❌ Error:', createError);
        throw createError;
      } else {
        console.log('✅ Table already exists and is accessible');
      }
    } else {
      console.log('✅ Newsletter table setup completed successfully!');
    }

    // Test the table by trying to select from it
    console.log('🔄 Testing table access...');
    const { data, error: testError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing table:', testError);
      throw testError;
    }

    console.log('✅ Newsletter table is working correctly!');
    console.log(`📊 Current subscribers count: ${data?.length || 0}`);

  } catch (error) {
    console.error('❌ Failed to setup newsletter table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupNewsletterTable()
    .then(() => {
      console.log('🎉 Newsletter setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { setupNewsletterTable };