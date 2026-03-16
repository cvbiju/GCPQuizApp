import json

# Detailed mapping per question per option
detailed_sources = {
    0: {
        "A": "https://cloud.google.com/compute/docs/ip-addresses",
        "B": "https://cloud.google.com/vpc/docs/using-routes#ip-forwarding",
        "C": "https://cloud.google.com/vpc/docs/configure-private-google-access",
        "D": "https://cloud.google.com/vpc/docs/routes",
        "E": "https://cloud.google.com/iam/docs/understanding-roles#compute.networkUser"
    },
    1: {
        "A": "https://cloud.google.com/vpc/docs/firewalls#default_firewall_rules",
        "B": "https://cloud.google.com/vpc/docs/firewalls#default_firewall_rules",
        "C": "https://cloud.google.com/vpc/docs/firewalls",
        "D": "https://cloud.google.com/vpc/docs/firewalls#default_firewall_rules",
        "E": "https://cloud.google.com/vpc/docs/firewalls#default_firewall_rules"
    },
    2: {
        "A": "https://cloud.google.com/source-repositories/docs",
        "B": "https://cloud.google.com/kms/docs/envelope-encryption",
        "C": "https://cloud.google.com/dlp/docs",
        "D": "https://cloud.google.com/compute/docs/instances/preemptible"
    },
    3: {
        "A": "https://cloud.google.com/architecture/identity/federating-gcp-with-active-directory-configuring-single-sign-on",
        "B": "https://cloud.google.com/architecture/identity/federating-gcp-with-active-directory-configuring-single-sign-on",
        "C": "https://cloud.google.com/iam/docs",
        "D": "https://developers.google.com/admin-sdk"
    },
    4: {
        "A": "https://cloud.google.com/architecture/best-practices-for-building-containers",
        "B": "https://cloud.google.com/architecture/best-practices-for-building-containers",
        "C": "https://cloud.google.com/architecture/best-practices-for-building-containers",
        "D": "https://cloud.google.com/architecture/best-practices-for-building-containers",
        "E": "https://cloud.google.com/architecture/best-practices-for-building-containers"
    },
    5: {
        "A": "https://cloud.google.com/armor/docs/cloud-armor-overview",
        "B": "https://cloud.google.com/vpc/docs/firewalls",
        "C": "https://cloud.google.com/iam/docs",
        "D": "https://cloud.google.com/cdn/docs"
    },
    6: {
        "A": "https://cloud.google.com/network-connectivity/docs/vpn/concepts/overview",
        "B": "https://cloud.google.com/vpc/docs/shared-vpc",
        "C": "https://cloud.google.com/network-connectivity/docs/interconnect/concepts/overview",
        "D": "https://cloud.google.com/vpc/docs/vpc-peering",
        "E": "https://cloud.google.com/vpc/docs/configure-private-google-access"
    },
    7: {
        "A": "https://cloud.google.com/iap/docs/signed-headers-howto",
        "B": "https://cloud.google.com/iap/docs/signed-headers-howto",
        "C": "https://cloud.google.com/iap/docs/signed-headers-howto",
        "D": "https://cloud.google.com/iap/docs/signed-headers-howto"
    },
    8: {
        "A": "https://cloud.google.com/monitoring/alerts/types-of-conditions#metric-threshold",
        "B": "https://cloud.google.com/monitoring/alerts/types-of-conditions#metric-threshold",
        "C": "https://cloud.google.com/logging/docs/logs-based-metrics",
        "D": "https://cloud.google.com/logging/docs/export/configure_export_v2"
    },
    9: {
        "A": "https://cloud.google.com/logging/docs/export/aggregated_sinks",
        "B": "https://cloud.google.com/logging/docs/export/aggregated_sinks",
        "C": "https://cloud.google.com/logging/docs/export/aggregated_sinks",
        "D": "https://cloud.google.com/storage/docs/access-control/iam"
    },
    10: {
        "A": "https://cloud.google.com/vpc/docs/using-flow-logs",
        "B": "https://cloud.google.com/armor/docs/cloud-armor-overview",
        "C": "https://cloud.google.com/dns/docs/dnssec",
        "D": "https://cloud.google.com/iap/docs"
    },
    11: {
        "A": "https://cloud.google.com/armor/docs",
        "B": "https://cloud.google.com/logging/docs/audit",
        "C": "https://cloud.google.com/security-command-center/docs/concepts-web-security-scanner-overview",
        "D": "https://cloud.google.com/security-command-center/docs"
    },
    12: {
        "A": "https://support.google.com/a/answer/140034?hl=en",
        "B": "https://support.google.com/a/answer/53926?hl=en",
        "C": "https://cloud.google.com/architecture/identity/overview-google-authentication",
        "D": "https://cloud.google.com/architecture/identity/overview-google-authentication"
    },
    13: {
        "A": "https://cloud.google.com/iam/docs/understanding-roles#organization-roles",
        "B": "https://cloud.google.com/iam/docs/understanding-roles#organization-roles",
        "C": "https://cloud.google.com/iam/docs/understanding-roles#organization-roles",
        "D": "https://cloud.google.com/iam/docs/understanding-roles#organization-roles"
    },
    14: {
        "A": "https://cloud.google.com/storage/docs/access-control/iam",
        "B": "https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys",
        "C": "https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances",
        "D": "https://cloud.google.com/kms/docs/envelope-encryption"
    },
    15: {
        "A": "https://forsetisecurity.org/docs/latest/concepts/",
        "B": "https://cloud.google.com/docs/security/infrastructure/secure-service-deployment",
        "C": "https://cloud.google.com/vpc/docs/routes",
        "D": "https://cloud.google.com/hybrid"
    },
    16: {
        "A": "https://cloud.google.com/dlp/docs/transformations-reference#generalization",
        "B": "https://cloud.google.com/dlp/docs/transformations-reference#redaction",
        "C": "https://cloud.google.com/dlp/docs/transformations-reference#cryptohashconfig",
        "D": "https://cloud.google.com/dlp/docs/transformations-reference#cryptoreplaceffxfpeconfig"
    },
    17: {
        "A": "https://support.google.com/a/answer/33386?hl=en",
        "B": "https://support.google.com/a/answer/33386?hl=en",
        "C": "https://support.google.com/a/answer/33386?hl=en",
        "D": "https://support.google.com/a/answer/33386?hl=en"
    },
    18: {
        "A": "https://cloud.google.com/kms/docs/envelope-encryption",
        "B": "https://cloud.google.com/kms/docs/envelope-encryption",
        "C": "https://cloud.google.com/kms/docs/envelope-encryption",
        "D": "https://cloud.google.com/kms/docs/envelope-encryption"
    },
    19: {
        "A": "https://cloud.google.com/architecture/exporting-stackdriver-logging-for-security-and-access-analytics",
        "B": "https://cloud.google.com/architecture/exporting-stackdriver-logging-for-security-and-access-analytics",
        "C": "https://cloud.google.com/architecture/exporting-stackdriver-logging-for-security-and-access-analytics",
        "D": "https://cloud.google.com/architecture/exporting-stackdriver-logging-for-security-and-access-analytics"
    },
    20: {
        "A": "https://cloud.google.com/appengine/docs/standard/python3/configuring-firewalls",
        "B": "https://cloud.google.com/functions/docs/networking/network-settings",
        "C": "https://cloud.google.com/vpc/docs/firewalls",
        "D": "https://cloud.google.com/kubernetes-engine/docs/concepts/network-policy",
        "E": "https://cloud.google.com/storage/docs/access-control"
    },
    21: {
        "A": "https://cloud.google.com/appengine/docs",
        "B": "https://cloud.google.com/appengine/docs/standard/python3/configuring-firewalls",
        "C": "https://cloud.google.com/iap/docs/concepts-overview",
        "D": "https://cloud.google.com/network-connectivity/docs/vpn/concepts/overview"
    },
    22: {
        "A": "https://cloud.google.com/kms/docs",
        "B": "https://cloud.google.com/storage/docs/lifecycle",
        "C": "https://cloud.google.com/dlp/docs/inspecting-images",
        "D": "https://cloud.google.com/dlp/docs/transformations-reference"
    },
    23: {
        "A": "https://cloud.google.com/iam/docs/creating-managing-service-account-keys",
        "B": "https://cloud.google.com/iam/docs/creating-managing-service-account-keys",
        "C": "https://cloud.google.com/iam/docs/creating-managing-service-account-keys",
        "D": "https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys"
    },
    24: {
        "A": "https://cloud.google.com/vpc/docs/shared-vpc",
        "B": "https://cloud.google.com/iam/docs/understanding-roles#compute-roles",
        "C": "https://cloud.google.com/vpc/docs/vpc-peering",
        "D": "https://cloud.google.com/network-connectivity/docs/vpn/concepts/overview"
    }
}

def enrich_sources():
    with open('questions.json', 'r') as f:
        questions = json.load(f)
        
    for i, q in enumerate(questions):
        if i in detailed_sources:
            q['sources'] = detailed_sources[i]
            # Remove the old global 'source' key if it exists
            if 'source' in q:
                del q['source']
            
    with open('questions.json', 'w') as f:
        json.dump(questions, f, indent=2)

if __name__ == "__main__":
    enrich_sources()
