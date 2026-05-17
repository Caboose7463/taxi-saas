const { Client } = require('pg');

const regions = [
  'us-east-1', 'us-west-1', 'us-west-2', 'ap-southeast-1', 'ap-northeast-1',
  'ap-northeast-2', 'ap-southeast-2', 'ap-south-1', 'eu-west-1', 'eu-west-2',
  'eu-central-1', 'ca-central-1', 'sa-east-1'
];

async function tryConnect(region) {
  const url = `postgresql://postgres.hqbhcxgccvlsdrqnljbp:HettieBells0%212345@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    await client.end();
    return url;
  } catch (e) {
    return null;
  }
}

async function findRegion() {
  console.log("Searching for Supabase region...");
  for (const region of regions) {
    process.stdout.write(`Trying ${region}... `);
    const result = await tryConnect(region);
    if (result) {
      console.log("SUCCESS!");
      console.log("FOUND URL:", result);
      return result;
    } else {
      console.log("Failed.");
    }
  }
  console.log("Could not find region.");
}

findRegion();
