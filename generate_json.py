import json

explanations = {
    0: {
        "A": "Correct: To prevent internet access, the instance must not have an External/Public IP address.",
        "B": "Incorrect: IP Forwarding is used when an instance acts as a router/NAT gateway, it doesn't directly prevent the instance itself from reaching the internet.",
        "C": "Correct: Private Google Access allows instances with only internal IP addresses to reach the external IP addresses of Google APIs and services. Disabling it blocks this access.",
        "D": "Incorrect: Static routes define paths to networks, disabling them could disrupt internal routing but isn't the primary way to block internet/Google API access.",
        "E": "Incorrect: IAM Network User role is for sharing networks across projects, it doesn't control internet access of a specific VM instance."
    },
    1: {
        "A": "Correct: A rule that allows all outbound (egress) connections with the lowest priority (65535) is implied in every VPC.",
        "B": "Correct: A rule that denies all inbound (ingress) connections with the lowest priority (65535) is implied in every VPC.",
        "C": "Incorrect: While GCP blocks port 25 out of the network broadly, it is not an implied VPC firewall rule.",
        "D": "Incorrect: The default implied rule allows all outbound connections, it does not block them.",
        "E": "Incorrect: Inbound connections are denied by default; there is no implied rule to allow port 80."
    },
    2: {
        "A": "Incorrect: Cloud Source Repositories and Cloud SQL are not designed for encrypted secret storage.",
        "B": "Correct: Encrypting secrets with CMEK via Cloud KMS and storing them in Cloud Storage was historically a recommended alternative (before Secret Manager was widely adopted) to keep them out of plain text in SCM.",
        "C": "Incorrect: Cloud DLP is used for redaction and inspection, not for managing/storing encrypted secrets.",
        "D": "Incorrect: Deploying SCM on a preemptible VM doesn't secure the secrets themselves."
    },
    3: {
        "A": "Correct: Cloud Directory Sync (GCDS) synchronizes Microsoft Active Directory users and groups to Google Cloud Identity. Once synchronized, IAM policies can be assigned directly to these groups.",
        "B": "Incorrect: SAML 2.0 Single Sign-On (SSO) handles authentication but does not synchronize users and groups to Cloud Identity for IAM authorization.",
        "C": "Incorrect: The IAM API does not automatically pull from Active Directory; Cloud Directory Sync is the automated tool for this.",
        "D": "Incorrect: While Admin SDK can create groups, this requires custom code. Cloud Directory Sync is the purpose-built, automated solution."
    },
    4: {
        "A": "Incorrect: A process running as PID 1 handles system signals differently, but preventing it is an operational choice (to respond to SIGTERM gracefully), not specifically a container security requirement.",
        "B": "Correct: The principle of least privilege in containers means running a single application per container to reduce the attack surface.",
        "C": "Correct: Removing unnecessary tools (like shell environments, utilities) reduces the risk of an attacker using them to escalate privileges or move laterally if the container is compromised.",
        "D": "Incorrect: Using public images without verification can introduce vulnerabilities; using a trusted, hardened base image is preferred.",
        "E": "Incorrect: Using many layers increases the image size and attack surface; it does not hide sensitive information since layers can be inspected."
    },
    5: {
        "A": "Correct: Cloud Armor provides Layer 7 protection (including IP allowlisting/denylisting) and relies on the HTTP(S) load balancer which inherently absorbs Layer 4 attacks like SYN floods.",
        "B": "Incorrect: VPC Firewall Rules can restrict IPs but do not provide explicit Layer 7 DDoS protections like Cloud Armor.",
        "C": "Incorrect: Cloud IAM controls who can manage resources, not network traffic rules.",
        "D": "Incorrect: Cloud CDN is for content caching and delivery, not for security rules or WAF capabilities."
    },
    6: {
        "A": "Correct: Cloud VPN securely extends your on-premises network to Google's network through an IPsec VPN tunnel, suitable for accessing the dedicated server room.",
        "B": "Incorrect: Shared VPC allows multiple GCP projects to share a common VPC, but does not connect GCP to an on-premises facility.",
        "C": "Correct: Cloud Interconnect provides low-latency, highly available connections that enable you to reliably transfer data between your on-premises and VPC networks.",
        "D": "Incorrect: VPC Peering connects two VPC networks in GCP, not an on-premises network.",
        "E": "Incorrect: Private Google Access allows VMs to reach Google APIs, it does not connect to an on-premises server room."
    },
    7: {
        "A": "Correct: To ensure traffic is strictly coming from IAP and not bypassed, your backend application must computationally verify the JWT assertion signed by Google in the HTTP request header (X-Goog-IAP-JWT-Assertion).",
        "B": "Incorrect: Validating identity headers (like x-goog-authenticated-user-email) can be spoofed; the JWT signature proves it came from Google.",
        "C": "Incorrect: x-forwarded-for just lists the IP path and can be spoofed.",
        "D": "Incorrect: Simple unique identifier headers are not cryptographically secure."
    },
    8: {
        "A": "Incorrect: Although mentioned in the raw text, an alerting policy checking process health does not track executions of an arbitrary script or hack. Note: the answer key given earlier said C.",
        "B": "Incorrect: CPU usage may not necessarily spike significantly due to the script, making it an unreliable metric for specific script execution.",
        "C": "Correct: By logging the script's execution to Stackdriver Logging, you can create a log-based metric that counts occurrences. You can then alert on this metric or display it on a dashboard.",
        "D": "Incorrect: BigQuery sinks are great for analytics, but scheduled queries run periodically and aren't directly meant for real-time alerting."
    },
    9: {
        "A": "Incorrect: Exporting from an organization folder with includeChildren=True will capture logs from all projects under it (including test/pre-prod), not just the development projects sharing a specific billing account.",
        "B": "Correct: An Aggregated Log Sink created at the Organization or Folder level can use a filter (`billingAccount=ABC-BILLING`) to exclusively select logs from development projects tied to that billing account, and export them to Cloud Storage or Pub/Sub.",
        "C": "Incorrect: Exporting from each project individually does not provide a centrally managed, unified perspective and is administratively complex.",
        "D": "Incorrect: Using a publicly shared bucket is a massive security risk and a violation of compliance."
    },
    10: {
        "A": "Incorrect: VPC Flow Logs capture network telemetry data for analytics, not for protecting against DNS hijacking or MITM.",
        "B": "Incorrect: Cloud Armor is a WAF meant to protect web applications from DDoS and specific Layer 7 attacks, it doesn't prevent domain hijacking.",
        "C": "Correct: Implementing DNSSEC (Domain Name System Security Extensions) on Cloud DNS cryptographically signs records, preventing attackers from intercepting DNS requests (DNS hijacking) and redirecting traffic via a Man-in-the-Middle attack.",
        "D": "Incorrect: Identity-Aware Proxy verifies identity before granting access to an application, but does not stop DNS hijacking."
    },
    11: {
        "A": "Incorrect: Cloud Armor is a Web Application Firewall that defends against OWASP top 10 at runtime, but doesn't scan the code or application for vulnerabilities.",
        "B": "Incorrect: Audit logs record administrative actions in GCP, not application vulnerabilities.",
        "C": "Correct: Web Security Scanner identifies security vulnerabilities (like XSS, Flash injection, out-of-date libraries) in your App Engine, GKE, and Compute Engine web applications.",
        "D": "Incorrect: Anomaly Detection looks for unusual behavioral patterns, not code/configuration vulnerabilities."
    },
    12: {
        "A": "Incorrect: Initiating a Domain Contestation Process is highly disruptive and assumes the current use is invalid.",
        "B": "Incorrect: Registering a new domain splits the corporate identity and creates administrative overhead for managing SAML/SSO links.",
        "C": "Correct: The least disruptive method is to identify the existing Super Administrator of the G Suite domain (already managed by the company) and have them manage the Cloud Identity needs, or provision the data science manager with the necessary Admin roles securely.",
        "D": "Incorrect: This just kicks the can down the road and doesn't explicitly resolve the infrastructure needs."
    },
    13: {
        "A": "Incorrect: Organization Administrator has very broad privileges, including changing organization policies, which might exceed the principle of least privilege for just managing permissions and auditing.",
        "B": "Incorrect: Security Reviewer is a read-only role and wouldn't allow the team to manage permissions.",
        "C": "Correct: Organization Role Administrator allows managing custom roles and IAM policies (permissions) across the organization, directly fulfilling the requirement to manage permissions.",
        "D": "Incorrect: Organization Policy Admin manages resource constraints (Org Policies), not IAM permissions."
    },
    14: {
        "A": "Incorrect: IP-based ACLs for Cloud Storage are not the recommended practice for GCP services, and relying on IP identity is less secure than IAM.",
        "B": "Incorrect: Storing service account credential keys (JSON files) inside the application configuration is a security risk if the instance is compromised.",
        "C": "Correct: Attaching a Service Account to the Compute Engine instance allows the application to automatically retrieve temporary OAuth2 credentials from the local metadata server, maintaining least privilege without managing static keys.",
        "D": "Incorrect: KMS encryption encrypts the data at rest, but doesn't solve the authorization problem of how to restrict bucket read access securely."
    },
    15: {
        "A": "Incorrect: Forseti is good for post-deployment monitoring and drift detection, but doesn't do static analysis in the CI/CD pipeline proactively.",
        "B": "Correct: Implementing Infrastructure as Code (IaC) with tools like Terraform, and using static analysis tools (like tfsec or Checkov) in the CI/CD pipeline, enforces security policies proactively without manual review overhead.",
        "C": "Incorrect: Routing all VPC traffic through customer-managed routers adds operations overhead, single points of failure, and doesn't replace architecture reviews.",
        "D": "Incorrect: Moving all production on-prem defeats the purpose of cloud scalability and does not securely enable developer autonomy in GCP."
    },
    16: {
        "A": "Incorrect: Generalization reduces the specificity of data (e.g. converting age 42 to age range 40-50), which makes identifying exact outliers hard and is not typically reversible.",
        "B": "Incorrect: Redaction completely removes the data. It cannot be reversed.",
        "C": "Incorrect: CryptoHashConfig permanently obfuscates the data via one-way hashing, which is not reversible.",
        "D": "Correct: Format-Preserving Encryption (CryptoReplaceFfxFpeConfig) encrypts the sensitive values while maintaining their formatting. Since it uses encryption, it is reversible (tokenization/pseudonymization) by users with the correct KMS key, allowing specific outliers to be identified later."
    },
    17: {
        "A": "Correct: Google Cloud Identity password guidelines recommend a minimum length of 8 characters, while strong recommendations often suggest longer, 8 is the configurable minimum for many standard compliance baselines in G Suite/Cloud Identity.",
        "B": "Incorrect: Cloud Identity's baseline minimum allowed is lower than 10.",
        "C": "Incorrect: Cloud Identity's baseline minimum allowed is lower than 12.",
        "D": "Incorrect: 6 characters is too short according to Google's best practices (which mandate at least 8)."
    },
    18: {
        "A": "Correct: Envelope Encryption involves generating a symmetric Data Encryption Key (DEK) locally to encrypt the data. Because managing thousands of DEKs is hard, you send the DEK to Cloud KMS to be encrypted by a Key Encryption Key (KEK). You then store the encrypted DEK alongside the encrypted data.",
        "B": "Incorrect: You do not store the KEK locally; the KEK remains securely in Cloud KMS.",
        "C": "Incorrect: Cloud KMS handles the KEK, not the generation of the local DEK. Generating the KEK locally defeats the purpose of Cloud KMS.",
        "D": "Incorrect: The KEK must reside in KMS, not locally."
    },
    19: {
        "A": "Incorrect: Syslog doesn't natively route natively out of Stackdriver without an intermediary.",
        "B": "Incorrect: BigQuery is for data warehousing and analytics; a SIEM doesn't typically query BQ in real-time for stream ingest.",
        "C": "Correct: Creating an Organizational Log Sink targeting a Cloud Pub/Sub topic ensures all logs are captured centrally. A Dataflow job or a Pub/Sub pull subscriber on the SIEM side can then reliably stream logs in real-time to the on-prem SIEM.",
        "D": "Incorrect: Querying REST APIs constantly to fetch logs is not scalable or real-time (polling vs event-driven)."
    },
    20: {
        "A": "Correct: App Engine allows defining egress firewall rules and VPC Serverless Access connecting to restricting outbound connections.",
        "B": "Incorrect: Cloud Functions has limited egress controls without additional VPC Serverless VPC connector controls.",
        "C": "Correct: Compute Engine instances run inside a VPC where outbound traffic can be explicitly controlled via VPC Firewall rules, meeting PCI DSS requirements without extra compensating controls.",
        "D": "Incorrect: GKE requires configuring Network Policies (extra compensating control) to strictly manage egress per pod.",
        "E": "Incorrect: Cloud Storage is not an application execution environment generating outbound traffic."
    },
    21: {
        "A": "Incorrect: App Engine does not use traditional Apache .htaccess files for authentication.",
        "B": "Incorrect: App Engine firewall rules act on IP addresses natively. Employees could be working from anywhere (dynamic IPs), making IP-based firewalls difficult to manage.",
        "C": "Correct: Cloud Identity-Aware Proxy (IAP) places a Google authentication layer in front of the application. By granting access to a Google Group containing employees and customers, anyone not authenticated is blocked regardless of their location.",
        "D": "Incorrect: Cloud VPN connects networks, but giving customers VPN access to internal networks is a massive security risk and overcomplicated for a web app."
    },
    22: {
        "A": "Incorrect: Encrypting the entire chat log doesn't remove the PII from the analyst's view when they legitimately need to decrypt the log to analyze customer service trends.",
        "B": "Incorrect: Deleting the logs destroys the data utility entirely.",
        "C": "Correct: The Cloud Data Loss Prevention (DLP) API has image inspection capabilities that can detect localized PII (like a credit card in an image) and redact it (black out the pixels), ensuring the rest of the document/image remains useful for text/trend analysis.",
        "D": "Incorrect: Texts are not the same as images, and bucketing doesn't explicitly redact an image's visible PII."
    },
    23: {
        "A": "Incorrect: No such automated command `enable-auto-rotate` exists for user-managed keys.",
        "B": "Incorrect: Providing a NEW_KEY flag in this manner is not a valid gcloud command syntax for IAM service accounts.",
        "C": "Correct: Google-recommended practice for user-managed keys is to create a new key, update your application configuration to use the new key, verify it works, and then delete the old key from the GCP console.",
        "D": "Incorrect: Storing the old key as a locally backed up key contradicts security best practices since an exposed old key can still be used if not rotated out of GCP."
    },
    24: {
        "A": "Correct: Shared VPC permits a centralized organization setup where a 'Host Project' contains the VPC, Subnets, and Firewall rules managed by the network security team. 'Service Projects' (engineering projects) can attach resources (like VMs) to these centralized subnets. The VPN gateway can also reside centrally in the Host Project.",
        "B": "Incorrect: Giving Compute Admin to the networking team across all projects violates least privilege and disperses control rather than centralizing it.",
        "C": "Incorrect: VPC peering at scale (hub and spoke) entails significant routing complexity and quota limits, and doesn't inherently centralize firewall policy management cleanly.",
        "D": "Incorrect: Creating Cloud VPN gateways across all projects does not centralize subnet/firewall management; it creates a sprawling mesh."
    }
}

def enrich():
    with open('questions_raw.json', 'r') as f:
        questions = json.load(f)
        
    for i, q in enumerate(questions):
        # We handle up to 25 questions, ensure we don't index out of bounds
        if i in explanations:
            q['explanations'] = explanations[i]
            # Fix answer in Q4 based on correct facts
            if i == 3: # array index 3 is Question #4
                q['answer'] = 'A'
            # Fix answer in Q9 based on correct facts
            if i == 8: # array index 8 is Question #9
                q['answer'] = 'C'
            # Fix answer in Q11 based on correct facts
            if i == 10: 
                q['answer'] = 'C'
                q['options']['C'] = 'Implement DNSSEC for Cloud DNS'
            
    with open('questions.json', 'w') as f:
        json.dump(questions, f, indent=2)
        
enrich()
