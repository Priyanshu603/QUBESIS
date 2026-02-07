const fs = require('fs').promises;
const dns = require('dns').promises;

// Define ISP_DNS_LIST: list of DNS servers to use for resolution
const ISP_DNS_LIST = ['8.8.8.8', '1.1.1.1', '208.67.222.222']; // Example: Google, Cloudflare, OpenDNS

// Define block_ips: list of blocked IPs (replace with actual blocked IPs)
const block_ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '104.18.27.120']; // Added example.com IP for testing

// Set DNS servers
dns.setServers(ISP_DNS_LIST);

// Function to check a single domain
async function checkDomain(domain) {
    try {
        const addresses = await dns.resolve4(domain);
        const blocked = addresses.some(ip => block_ips.includes(ip));

        const result = {
            domain,
            resolved_ips: addresses,
            is_blocked: blocked,
            timestamp: new Date().toISOString()
        };

        if (blocked) {
            console.log(`NOTICE: Domain ${domain} is blocked (resolved to blocked IP: ${addresses.join(', ')})`);
        } else {
            console.log(`Domain ${domain} is not blocked (resolved to: ${addresses.join(', ')})`);
        }

        return result;
    } catch (err) {
        console.log(`Error resolving ${domain}: ${err.message}`);
        return {
            domain,
            error: err.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Main function
async function main() {
    try {
        const data = await fs.readFile('domains.json', 'utf8');
        const domains = JSON.parse(data);

        if (!Array.isArray(domains)) {
            console.error('domains.json should contain an array of domains');
            return;
        }

        console.log('Starting domain check for Nawala domains...\n');

        const results = [];

        // Process domains sequentially to avoid overwhelming DNS servers
        for (const domain of domains) {
            const result = await checkDomain(domain);
            results.push(result);
            // Small delay to be respectful to DNS servers
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save results to a file
        await fs.writeFile('check_results.json', JSON.stringify(results, null, 2));
        console.log('\nResults saved to check_results.json');

    } catch (err) {
        console.error('Error in main function:', err);
    }
}

// Run the bot
main();
