const { Client } = require('pg')

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'us-east-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ca-central-1'
]

const password = 'sM3mGZajnZiaCBoW'
const projectRef = 'hunnvtfeqinxurrxcdso'

async function checkPolicies() {
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`
    
    const client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000
    })

    try {
      await client.connect()
      console.log(`Connected to ${region}`)
      
      const res = await client.query(`
        SELECT tablename, policyname, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public';
      `)
      console.log('Policies:')
      console.log(JSON.stringify(res.rows, null, 2))
      
      const tablesRes = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public';
      `)
      console.log('Tables and RLS status:')
      console.log(JSON.stringify(tablesRes.rows, null, 2))

      await client.end()
      return
    } catch (err) {
      try { await client.end() } catch (e) {}
    }
  }
  console.log('Could not connect to any region.')
}

checkPolicies()
