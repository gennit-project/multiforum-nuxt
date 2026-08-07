mock_provider "aws" {
  mock_data "aws_vpc" {
    defaults = {
      id = "vpc-contract"
    }
  }

  mock_data "aws_subnets" {
    defaults = {
      ids = ["subnet-contract-b", "subnet-contract-a"]
    }
  }

  mock_data "aws_ssm_parameter" {
    defaults = {
      value = "ami-contract"
    }
  }

  mock_resource "aws_eip" {
    defaults = {
      public_ip = "203.0.113.20"
    }
  }
}

run "production_contract" {
  command = apply

  variables {
    admin_cidr        = "198.51.100.10/32"
    ssh_key_name      = "multiforum-contract"
    application_cidrs = ["0.0.0.0/0"]
    domain            = "forum.example.com"
    acme_email        = "admin@example.com"
    release_version   = "1.2.3"
    repository_ref    = "v1.2.3"
    neo4j_image       = "neo4j:contract"
    backend_image     = "ghcr.io/example/backend:contract"
    frontend_image    = "ghcr.io/example/frontend:contract"
    caddy_image       = "caddy:contract"
  }

  assert {
    condition     = output.application_url == "https://forum.example.com"
    error_message = "The application URL must use the configured production domain over HTTPS."
  }

  assert {
    condition = output.dns_a_record == {
      name  = "forum.example.com"
      type  = "A"
      value = "203.0.113.20"
    }
    error_message = "The DNS handoff must point the configured domain at the allocated public IP."
  }

  assert {
    condition     = length(aws_security_group.multiforum.ingress) == 4
    error_message = "The host must expose only SSH and Caddy's three public listener rules."
  }

  assert {
    condition = alltrue([
      for rule in aws_security_group.multiforum.ingress :
      rule.from_port != 3000 && rule.to_port != 3000 &&
      rule.from_port != 4000 && rule.to_port != 4000 &&
      rule.from_port != 7474 && rule.to_port != 7474 &&
      rule.from_port != 7687 && rule.to_port != 7687
    ])
    error_message = "Frontend, backend, and Neo4j ports must not be publicly exposed by Terraform."
  }

  assert {
    condition = alltrue([
      for listener in [
        { protocol = "tcp", port = 80 },
        { protocol = "tcp", port = 443 },
        { protocol = "udp", port = 443 }
        ] : length([
          for rule in aws_security_group.multiforum.ingress : rule
          if rule.protocol == listener.protocol &&
          rule.from_port == listener.port &&
          rule.to_port == listener.port &&
          contains(rule.cidr_blocks, "0.0.0.0/0")
      ]) == 1
    ])
    error_message = "Caddy must receive public HTTP, HTTPS, and HTTP/3 traffic."
  }

  assert {
    condition = alltrue([
      strcontains(aws_instance.multiforum.user_data, "--branch 'v1.2.3'"),
      strcontains(aws_instance.multiforum.user_data, ".env.production"),
      strcontains(aws_instance.multiforum.user_data, "MULTIFORUM_RELEASE_VERSION=1.2.3"),
      strcontains(aws_instance.multiforum.user_data, "chmod 0600 /opt/multiforum/.env.production"),
      strcontains(aws_instance.multiforum.user_data, "/etc/systemd/system/multiforum-backup.timer"),
      strcontains(aws_instance.multiforum.user_data, "/etc/multiforum/backup.env"),
      strcontains(aws_instance.multiforum.user_data, "multiforum-restic.env.example"),
      strcontains(aws_instance.multiforum.user_data, "offsite.conf.example"),
      strcontains(aws_instance.multiforum.user_data, "  - restic"),
      !strcontains(aws_instance.multiforum.user_data, "enable --now multiforum-backup.timer"),
      !strcontains(aws_instance.multiforum.user_data, "/etc/multiforum/restic.env\n"),
      !strcontains(aws_instance.multiforum.user_data, "service.d/offsite.conf\n"),
      strcontains(aws_instance.multiforum.user_data, "docker pull 'neo4j:contract'"),
      strcontains(aws_instance.multiforum.user_data, "docker pull 'ghcr.io/example/backend:contract'"),
      strcontains(aws_instance.multiforum.user_data, "docker pull 'ghcr.io/example/frontend:contract'"),
      strcontains(aws_instance.multiforum.user_data, "docker pull 'caddy:contract'"),
      !strcontains(aws_instance.multiforum.user_data, ".env.quickstart"),
      !strcontains(aws_instance.multiforum.user_data, "docker compose up")
    ])
    error_message = "Cloud-init must stage the production configuration and images without starting an unconfigured stack."
  }
}
