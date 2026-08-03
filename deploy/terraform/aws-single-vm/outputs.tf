output "public_ip" {
  description = "Stable public IPv4 address of the Multiforum host."
  value       = aws_eip.multiforum.public_ip
}

output "application_url" {
  description = "Temporary HTTP URL. Configure a domain and TLS before production use."
  value       = "http://${aws_eip.multiforum.public_ip}:3000"
}

output "ssh_command" {
  description = "SSH command for completing application configuration."
  value       = "ssh ubuntu@${aws_eip.multiforum.public_ip}"
}
