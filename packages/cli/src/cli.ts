#!/usr/bin/env node

import { MediaHubClient } from '@mediahub/sdk';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = process.env.MEDIAHUB_API_KEY || 'mh_live_demo_key';
  const client = new MediaHubClient({ apiKey });

  switch (command) {
    case 'whoami':
    case 'login': {
      try {
        const info = await client.me();
        console.log(` Authenticated as: ${info.user.email}`);
        console.log(` Key Prefix: ${info.keyPrefix}`);
        console.log(` Active Scopes: ${info.scopes.join(', ')}`);
      } catch (err: any) {
        console.error(` Authentication failed: ${err.message}`);
      }
      break;
    }

    case 'org': {
      const sub = args[1];
      if (sub === 'list') {
        const orgs = await client.orgs.list();
        console.log(` Organizations (${orgs.length}):`);
        orgs.forEach((o) => console.log(`  - [${o.slug}] ${o.name} (${o.plan} Plan) - ${o.membersCount} members, ${o.projectsCount} projects`));
      } else {
        console.log('Usage: mediahub org list');
      }
      break;
    }

    case 'analyze': {
      const url = args[1];
      if (!url) {
        console.error('Usage: mediahub analyze <URL>');
        process.exit(1);
      }
      console.log(` Analyzing ${url}...`);
      try {
        const metadata = await client.media.analyze(url);
        console.log(` Title: ${metadata.title}`);
        console.log(` Platform: ${metadata.platform}`);
        console.log(` Formats Available: ${metadata.qualities.combined.length} video, ${metadata.qualities.audio.length} audio`);
      } catch (err: any) {
        console.error(` Analysis failed: ${err.message}`);
      }
      break;
    }

    case 'apikey': {
      const sub = args[1];
      if (sub === 'list') {
        const keys = await client.keys.list();
        console.log(` API Keys (${keys.length}):`);
        keys.forEach((k) => console.log(`  - [${k.id}] ${k.name} (${k.keyPrefix}...) - Scopes: ${k.scopes.join(',')}`));
      } else {
        console.log('Usage: mediahub apikey list');
      }
      break;
    }

    default: {
      console.log(`
MediaHub Commercial SaaS CLI (v1.0.0)

Commands:
  mediahub whoami           Verify API Key identity & scopes
  mediahub org list         List active Organizations & Subscriptions
  mediahub analyze <URL>    Extract metadata for a media URL
  mediahub apikey list      List active developer API Keys
      `);
      break;
    }
  }
}

main();
