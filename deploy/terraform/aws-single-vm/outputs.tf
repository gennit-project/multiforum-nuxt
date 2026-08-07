output "public_ip" {
  description = "Stable public IPv4 address of the Multiforum host."
  value       = aws_eip.multiforum.public_ip
}

output "application_url" {
  description = "Public HTTPS URL served by Caddy after DNS and application configuration are complete."
  value       = "https://${var.domain}"
}

output "dns_a_record" {
  description = "DNS A record to create before starting the production stack."
  value = {
    name  = var.domain
    type  = "A"
    value = aws_eip.multiforum.public_ip
  }
}

output "ssh_command" {
  description = "SSH command for completing application configuration."
  value       = "ssh ubuntu@${aws_eip.multiforum.public_ip}"
}
