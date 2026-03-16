const fs = require('fs');

const dataRaw = fs.readFileSync('questions.json', 'utf-8');
const questions = JSON.parse(dataRaw);

const tagsMapping = {
    'IAM': ['iam', 'identity', 'access', 'role', 'service account', 'cloud identity', 'oauth', 'token', 'saml', 'groups'],
    'Networking': ['vpc', 'firewall', 'load balancer', 'peering', 'interconnect', 'vpn', 'cloud armor', 'dns', 'router', 'nat', 'cdn'],
    'Data & Storage': ['bucket', 'storage', 'bigquery', 'spanner', 'sql', 'kms', 'encryption', 'csek', 'cmek', 'dlp', 'data loss'],
    'Compute': ['gce', 'compute engine', 'vm', 'instance', 'gke', 'kubernetes', 'cluster', 'node', 'app engine', 'cloud run', 'functions'],
    'Security Operations': ['security command center', 'scc', 'logging', 'monitoring', 'audit', 'forseti', 'chronicle', 'anomaly', 'threat', 'vulnerability']
};

questions.forEach(q => {
    let assignedTags = new Set();
    const textToSearch = (q.question + ' ' + Object.values(q.options).join(' ') + ' ' + (q.hint || '')).toLowerCase();
    
    for (const [tag, keywords] of Object.entries(tagsMapping)) {
        for (const kw of keywords) {
            if (textToSearch.includes(kw.toLowerCase())) {
                assignedTags.add(tag);
                break; // One hit per category is enough
            }
        }
    }
    
    if (assignedTags.size === 0) {
        assignedTags.add('General Security');
    }
    
    q.tags = Array.from(assignedTags);
});

fs.writeFileSync('questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully tagged ' + questions.length + ' questions.');
