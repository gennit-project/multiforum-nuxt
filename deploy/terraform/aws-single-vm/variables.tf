variable "aws_region" {
  type        = string
  description = "AWS region in which to create the Multiforum host."
  default     = "us-east-1"
}

variable "name" {
  type        = string
  description = "Name prefix applied to the instance and security group."
  default     = "multiforum"

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]{1,32}$", var.name))
    error_message = "name must contain 1-32 letters, numbers, or hyphens."
  }
}

variable "admin_cidr" {
  type        = string
  description = "Single trusted IPv4 CIDR allowed to SSH to the host, for example 203.0.113.10/32."

  validation {
    condition     = can(cidrnetmask(var.admin_cidr))
    error_message = "admin_cidr must be a valid IPv4 CIDR. Prefer a single-address /32."
  }
}

variable "ssh_key_name" {
  type        = string
  description = "Name of an existing EC2 key pair used to access the Ubuntu host."
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type. t3.large is the conservative starting point for Neo4j plus both app services."
  default     = "t3.large"
}

variable "root_volume_size_gib" {
  type        = number
  description = "Size of the encrypted gp3 root volume, which also stores Neo4j Docker volumes."
  default     = 40

  validation {
    condition     = var.root_volume_size_gib >= 30
    error_message = "root_volume_size_gib must be at least 30 GiB."
  }
}

variable "application_cidrs" {
  type        = list(string)
  description = "IPv4 CIDRs allowed to reach Caddy on HTTP, HTTPS, and HTTP/3. Use 0.0.0.0/0 for a public forum."

  validation {
    condition     = length(var.application_cidrs) > 0 && alltrue([for cidr in var.application_cidrs : can(cidrnetmask(cidr))])
    error_message = "application_cidrs must contain at least one valid IPv4 CIDR."
  }
}

variable "domain" {
  type        = string
  description = "Public DNS hostname used by Multiforum and Caddy, for example forum.example.com."

  validation {
    condition     = length(var.domain) <= 253 && can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.domain))
    error_message = "domain must be a lowercase fully qualified DNS hostname without a trailing dot."
  }
}

variable "acme_email" {
  type        = string
  description = "Email address Caddy supplies to the ACME certificate authority."

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,63}$", var.acme_email))
    error_message = "acme_email must be a valid email address using ordinary DNS characters."
  }
}

variable "repository_ref" {
  type        = string
  description = "Git branch or tag containing the deployment configuration. Pin a release tag for repeatable installs."
  default     = "main"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._/-]{1,100}$", var.repository_ref))
    error_message = "repository_ref contains unsupported characters."
  }
}

variable "backend_image" {
  type        = string
  description = "Backend OCI image pulled during cloud-init. Pin a release or digest for repeatable installs."
  default     = "ghcr.io/gennit-project/multiforum-backend:edge"

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,254}$", var.backend_image))
    error_message = "backend_image must be a valid OCI image reference without whitespace."
  }
}

variable "neo4j_image" {
  type        = string
  description = "Neo4j OCI image pulled during cloud-init. Pin a tested version or digest."
  default     = "neo4j:5.1.0"

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,254}$", var.neo4j_image))
    error_message = "neo4j_image must be a valid OCI image reference without whitespace."
  }
}

variable "frontend_image" {
  type        = string
  description = "Frontend OCI image pulled during cloud-init. Pin a release or digest for repeatable installs."
  default     = "ghcr.io/gennit-project/multiforum-nuxt:edge"

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,254}$", var.frontend_image))
    error_message = "frontend_image must be a valid OCI image reference without whitespace."
  }
}

variable "caddy_image" {
  type        = string
  description = "Caddy OCI image pulled during cloud-init. Pin a tested version or digest."
  default     = "caddy:2.11.4-alpine"

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,254}$", var.caddy_image))
    error_message = "caddy_image must be a valid OCI image reference without whitespace."
  }
}
