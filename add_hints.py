import json

# Contextual hints designed to nudge the user to the underlying concept without giving away the exact answer letter.
hints = {
    0: "Think about how instances receive routing and address assignments. What specific component allows an instance to communicate directly with the internet?",
    1: "Consider what kind of traffic a newly created VPC allows or denies by default without any custom rules. How does traffic flow in vs out?",
    2: "You are looking for a solution that encrypts the sensitive material *before* it gets committed to the repository, utilizing a centralized key management service.",
    3: "Look for the tool designed explicitly to bridge Microsoft's directory service with Google's identity platform.",
    4: "If an attacker compromises one part of the container, you want to limit what else they can do. Reducing the 'attack surface' is key.",
    5: "Which GCP service acts at the edge as a Web Application Firewall (WAF) to filter incoming HTTP(S) traffic based on IP or geography?",
    6: "A dedicated server room implies a physical location separate from GCP. Which service physically connects an on-premise network to a VPC with high reliability?",
    7: "Identity-Aware Proxy passes identity information downstream. How can you cryptographically verify that this information hasn't been spoofed by a client directly hitting the backend?",
    8: "You need a mechanism that counts specific text occurrences in logs and translates them into a time-series data point you can alert on.",
    9: "You need to export logs for multiple projects grouped together under a specific categorization. How do you centralize log export configuration at a higher hierarchy level?",
    10: "Which protocol extension cryptographically signs DNS records to ensure the responses haven't been tampered with in transit?",
    11: "You are looking for a managed service that actively crawls and tests web applications for common vulnerabilities like cross-site scripting (XSS) at runtime.",
    12: "The company already uses G Suite (Google Workspace). Cloud Identity can often be managed seamlessly by the administrators of the existing domain.",
    13: "Look for the specific IAM role that explicitly grants the ability to define and assign access policies across the entire GCP organization.",
    14: "For an application running on Compute Engine, what is the most secure, native way to provide it with temporary, automatically rotating credentials?",
    15: "Consider how you can automate security checks *before* infrastructure is deployed. How does modern DevOps enforce policies in code?",
    16: "You need a transformation method that encrypts the data (so it can be reversed/decrypted later) but keeps the original format intact so databases don't break.",
    17: "Think about standard industry baselines for minimum password length that balance usability and brute-force resistance. Google enforces this as the minimum floor in Cloud Identity.",
    18: "In envelope encryption, the service (KMS) holds the master key (KEK), while you use another key locally (DEK) to encrypt the actual data. How does KMS interact with your local key?",
    19: "You need to ingest logs into a third-party, potentially on-premise SIEM in real-time. Which GCP messaging service acts as a perfect buffer and delivery mechanism for streaming data?",
    20: "Which computing environment provides native, granular control over egress network traffic using standard VPC Firewall rules?",
    21: "You need an authentication layer that sits in front of the web application and verifies user identity against Google Groups, regardless of where the user connects from.",
    22: "You need a service capable of analyzing images (OCR) to proactively find and obscure sensitive data before it's saved.",
    23: "Security best practices dictate that key rotation should involve creating a new key, switching the application over, and *then* deleting the old key.",
    24: "Which networking construct allows a central 'host' project to manage subnets and firewalls, while allowing 'service' projects to securely attach VMs to those subnets?"
}

def enrich_hints():
    with open('questions.json', 'r') as f:
        questions = json.load(f)
        
    for i, q in enumerate(questions):
        if i in hints:
            q['hint'] = hints[i]
            
    with open('questions.json', 'w') as f:
        json.dump(questions, f, indent=2)

if __name__ == "__main__":
    enrich_hints()
